// frontend/src/main.jsx
// Punto de entrada del frontend: aquí arrancamos REACT

import React from "react"; // Importar libreria React 
import { createRoot } from "react-dom/client"; // React 18, API MODERNA 
import { BrowserRouter } from "react-router-dom"; // Navegacion por urls
import App from './app/App.jsx' // importamos app de app.jsx, nuestro componente principal
import './styles/global.css'; // CSS global para el proyecto

// 1) Buscamos elemento de HTML donde REACT nos va a renderezar todo
// EN nuestro caso es index.html
const rootEL = document.getElementById('root');

// 2) Si no existiese #root, mostramos error
// Esto evita crasheos 
if (!rootEL) {
    console.error(
        '[BOOT] No se encontro el elemento #root, revisa <div id="root"></div> en index.html'
    );
} else {
    // 3) Raiz de React
    // Esto nos permite randerizar los componentes desde la carpeta components
    const root = createRoot(rootEL);

    // 4) Renderizado de la app
    /* 
    - StrictMode = nos ayuda a detectar errores/side-effects 
    - BrowserRouter  = nos permite habilitar rutas sin tener que recargar la pagina
    - App = componente RAÍZ, a partir de ahí,se monta todo  
    */

    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </React.StrictMode>
    );
}