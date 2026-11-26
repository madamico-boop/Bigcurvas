const fs = require('fs');
const path = require('path');

const archivos = [
    path.join(__dirname, '..', 'backend', 'server.js')
];

const carpetaFrontend =
    path.join(
        __dirname,
        '..',
        'frontend',
        'js'
    );

for (
    const nombre of fs.readdirSync(
        carpetaFrontend
    )
) {

    if (
        nombre.endsWith('.js')
    ) {

        archivos.push(
            path.join(
                carpetaFrontend,
                nombre
            )
        );

    }

}

let errores = 0;

for (
    const archivo of archivos
) {

    try {

        const contenido =
            fs.readFileSync(
                archivo,
                'utf8'
            );

        new Function(
            contenido
        );

        console.log(
            'OK  ' +
            path.relative(
                path.join(
                    __dirname,
                    '..'
                ),
                archivo
            )
        );

    } catch (error) {

        errores += 1;

        console.error(
            'ERROR  ' +
            archivo
        );

        console.error(
            error.message
        );

    }

}

if (
    errores > 0
) {

    console.error(
        '\nSe encontraron ' +
        errores +
        ' archivo(s) con errores de sintaxis.'
    );

    process.exit(1);

}

console.log(
    '\nVerificación de sintaxis completada correctamente.'
);
