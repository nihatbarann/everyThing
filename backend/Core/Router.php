<?php
class Router {
    private $routes = [];

    public function addRoute($method, $path, $handler) {
        // Simple router logic
        $path = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '([^/]+)', $path);
        
        // Strip out the base folder /everyThing/backend for local setups
        $baseFolder = '/everyThing/backend';
        
        $this->routes[] = [
            'method' => $method,
            'path' => '#^' . $path . '$#',
            'handler' => $handler
        ];
    }

    public function get($path, $handler) { $this->addRoute('GET', $path, $handler); }
    public function post($path, $handler) { $this->addRoute('POST', $path, $handler); }
    public function put($path, $handler) { $this->addRoute('PUT', $path, $handler); }
    public function delete($path, $handler) { $this->addRoute('DELETE', $path, $handler); }

    public function dispatch($uri, $method) {
        $parsedUrl = parse_url($uri);
        $path = $parsedUrl['path'];
        
        // Remove base path to support running from subfolder in Apache
        $basePath = '/everyThing/backend';
        if (strpos($path, $basePath) === 0) {
            $path = substr($path, strlen($basePath));
        }

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['path'], $path, $matches)) {
                array_shift($matches); // Remove the full match
                
                // Call the handler
                list($controller, $action) = explode('@', $route['handler']);
                $controllerPath = __DIR__ . '/../Controllers/' . $controller . '.php';
                if(file_exists($controllerPath)) {
                    require_once $controllerPath;
                    $controllerInstance = new $controller();
                    call_user_func_array([$controllerInstance, $action], $matches);
                    return;
                }
            }
        }
        http_response_code(404);
        echo json_encode(['error' => 'Not Found']);
    }
}
