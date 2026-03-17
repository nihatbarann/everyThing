<?php

class AuthMiddleware {
    private $secretKey = "EveryThing_Super_Secret_Key_Change_In_Prod";

    public function verifyToken() {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $jwt = $matches[1];
            $tokenParts = explode('.', $jwt);
            
            if(count($tokenParts) != 3) {
                return false;
            }

            $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
            $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
            $signatureProvided = $tokenParts[2];

            $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
            $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
            $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secretKey, true);
            $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

            if (hash_equals($base64UrlSignature, $signatureProvided)) {
                $payloadData = json_decode($payload, true);
                if($payloadData['exp'] > time()) {
                    return $payloadData; // Valid user payload
                }
            }
        }
        
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
}
