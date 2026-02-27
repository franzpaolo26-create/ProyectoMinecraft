// backend/src/index.js

/*
    index.js es el Main.java, del backend
    
    - importar la app.js, hecha con express,. 
    - leer variables de entorno
    - arrancar el servidor http
    - manejar el shutdown del servidor y de la DB 

*/

// 1) IMPORTACIONES

import { resolveConfig } from 'vite';
import app from './app.js'; // app de app.js hecha con express/ aplicación web
import * as env from './config/env.js'; // importar variables de validación de entorno(DB_NAME, PORT, etc...)

// 2) ENTORNO DE EJECUCIÓN (NODE_ENV y PORT)

/*

NODE_ENV es una convención en Node para indicar el modo=
    
    - development = desarrollo (logs mas abundante)
    - production = producción (más estricto)
    - test = testing

*/

// si no tenemos NODE_ENV, ponemos 'development'
// cuidado process.env es como "System.getenv() en Java"

const NODE_ENV = process.env.NODE_ENV || env.NODE_ENV || 'development';


// 2.1) Función normalizePort()
// EN Node las variables, de entorno vienen como texto tipo string
//Ejemplo= "4000"
//Queremos convertirlo a numero y validarlo 

/*

La funcion normalizePort() hace lo siguiente=

    - Number(value) --> intenta si es posible convertir a nuemero
    - si no es un numero valido o es igual o menor de cero usa el fallback (4000)

*/

function normalizePort(value, fallback = 4000) {
    const n = Number(value)

    // Number.isFinite(n), nos asegura que n NO sea NaN(no existente) ni INFINITY
    // n > 0 nos asegura el puerto positivo
    return Number.isFinite(n) && n > 0 ? n : fallback;

}

// Puerto final:
// - env.PORT de env.js
// - si no, process.env.PORT (variable directa del sistema)
// - en caso que no exista, 4000
//
// "??" (nullish coalescing) significa lo siguiente=
// USA nullish si NO es NULL NI undefined
// EN caso de que lo sea, usa coalescing

const PORT = normalizePort(env.PORT ?? process.env.PORT, 4000);

// 3)   CARGAR LOGGER Y DB(DATABASE)

/*

como deseamos un index.js robusto, crearemos un logger.js
lo mismo con db.js, cuando lo exportemos, lo utilizaremos para cerrarlo en shutdown

*/

// 3.1) loadLogger()
/*

"async" significa que la funcion, devuelve, una promimse (promesa)
en java, hay meotodos similares que trabajan con elementos asincrinos
aunque Java no tiene un "await" nativo 

*/

async function loadLogger() {
    try {
    //intenta, cargar el modulo en runtime
    // en caso de que el archivo lanzara un error y caerá el catch
    const mod = await import('./config/logger.js');
    
    // export default logger 
    // export const logger 
    // esta constante, cuber ambas formas de exportación 
    const candidate = mod?.default ?? mod?.logger ?? mod;

    // si candidate parece/es un logger (tiene info o error como función), lo usaremos

    if (
        candidate && 
        (typeof candidate.info === 'function' ||typeof candidate.error === 'function')
    ) {
        return candidate;
    }

    } catch {
        // en caso de que nos falle el import, ignoramos
        // con esto no rompemos el server, 
    }

    //Fallback seguro: 
    return console;
}

// 3.2) loadPool()
/*

aqui intentaremos, cargar la pool de PostgreSQL (pg)
En Node, pg crea un Pool con conexiones 
para cerrarlo, se usa pool.end

*/

async function loadPool() {
    try {
        const mod = await import('./config/db.js');

        const candidate = mod?.pool ?? mod?.default ?? mod;

        //si tiene metodo end(), ausmimos que es el Pool
        if(candidate && typeof candidate.end === 'function') return candidate;
    } catch {
        // en caso que no exista/encuentre el ficher
    }

    return null;

}


// 4) INICIALIZAR LOGGER Y POOL 

// Como loadLogger/loadPool son async, necesitamos await

// esto implica que este archivo corre en ESM, y permite top level await 
// Node a dia de hoy, unicamente soporta modulos ESM 

const logger = await loadLogger();
const pool = await loadPool();

// 5) CREACION DE FUNCIONES

/*

Si el logger real existe, usamos logger.info/warn/error
si no, usamos console.log/warn/error

bind(....) fija el this correcto como en java cuando se pasa un metodo

*/


const logInfo = 
    typeof logger?.info === 'function'
    ? logger.info.bind(logger)
    : console.log.bind(console);

const logWarn = 
    typeof logger?.warn === 'function'
    ? logger.warn.bind(logger)
    : console.warn.bind(console);

const logError = 
    typeof logger?.error === 'function'
    ? logger.error.bind(logger)
    : console.error.bind(console);


// 6 arranque de servidor

/*

    app.listen(PORT, callback) hace que el servidor empiece a escuchar
    app.listen(...), nos deuelve un objeto "server", en este caso con metodo close()
    para apagarlo

    shuttingDown es un "flag" (boolean) para no apagar dos veces

*/

let shuttingDown = false;


const server = app.listen(PORT, () => {
    // este callback, se ejecta cuando el server, ya esta previamente levantado

    logInfo('server running on port ${PORT} (${NODE_ENV})');
});


// 7) CIERRE DE SERVIDOR Y DE POOL (shuttingDown limpio)


/*

7.1) closeServer()

server.close() es asincrono con callback
para poder utilizar await, lo envolvemos en una promise 

*/

async function closeServer() {
    // en caso de que no exista server.close, no hacemos nada
    if (!server || typeof server.close !== 'function') return;
    
    await new Promise((resolve) => {
        try {
            // cierra el server 
            //al finalizar,lla al callback y resolvemos la promise
            server.close(() => resolve());
        } catch {
            // si falla por cualquier razon se resuelve, para no bloquear
            resolve();
        }
    })
}


// 7.2) closePool()
/*

pool.end() cierra todas las conexiones del pool

*/

async function closePool() {
// si no existe nuestra pool, o no tiene .end
    if (!pool || typeof pool.end !== 'function') return ;

    try {
        await pool.end();
    } catch (e) {
        // si falla el cierre se genera el registro pero seguimos
        //mejor intentar apagar antes de quedarse colgado
        logWarn('error closing db pool', e); 
    }
}

//8) FUNCION shutdown() apagado controlado

/*esta funcion, nos permite el shutdown limpio

RECIBE=

- exitCode: 0 (ok) o 1 (error)
- reason: texto humano
- err: el error real(si compete)

    Pasos=

    1) EVITAR DOBLE APAGADO
    2) LOGUEA LA RAZON
    3) PONE UN TIMEOUT DE SEGURIDAD 
    4) INTENTA CERRAR EL SERVER Y POOL 
    5) SALE DEL PROCESO CON process.exit(exitCode) 

*/

async function shutdown(exitCode, reason, err) {
    // si ya estamos apagando, no se hace nada
    if (shuttingDown) return;
    shuttingDown = true;

    // Log de la razon

    if (reason) logWarn('shutdown requested: ${reason}');

    // Log del error si existe
    if (err) logError(err);

    // timeout de seguridad 
    // si algo se queda pillado despues de 10s forzamos la salida
    // para no quedarnos eternamente

    const forceTimer = setTimeout(() => {
        logError('forced shutdown: timeout exceeded');
        process.exit(1);
    }, 10_000);

    try {
        //1) cierra servidor HTTP 
        await closeServer();
        
        // 2)cierra la pool de DB
        await closePool(); 
    } finally {
        //Quitamos el timeout y salimos con el exitCode correcto
        clearTimeout(forceTimer);
        process.exit(exitCode); 
    }
}


// 9) SEÑALES DEL SISTEMA SIGINIT SIGTERM
/*
    SIGINT= Ctrl + C en la terminal 
    SIGTERM= señal tipica de apagarse

*/

process.on('SIGINT', () => shutdown(0, 'SIGINT'));
process.on('SIGTERM', () => shutdown(0, 'SIGTERM')); 


// 10) ERRORES GLOBALES     

// 10.1) unhandledRejection
// una promise que falla y nadie hizo catch()
// eso  deja el proceso em estado weird/raro ---> mejor opcion, apagar y reiniciar

process.on('unhandledRejection', (reason) => {
    shutdown(1, 'unhandledRejection', reason);
});

// 10.2) uncaughtException
// Error, NO capturado en ningun try/catch
// suele ser fatal --> la app peta

process.on('uncaughtException', (err) => {
    shutdown(1, 'uncaughtException', err);
});



// 11) ERRORES DE SERVIDOR

// server emite eventos
// si hay un error importante, lo tratamos como fatal

server.on?.('error',(err) => {
    shutdown(1, 'server error', err);
});


// 12) EXPORTAR server para futuros test

//EN el futuro se pueden hacer test
//-importar server
// cerrarlo, al terminar el test

export default server;