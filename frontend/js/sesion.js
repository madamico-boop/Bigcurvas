// =====================================
// SESIÓN GENERAL BIGCURVAS
// =====================================

async function comprobarSesionGeneral() {

    try {

        const respuesta =
            await fetch(
                '/api/auth/me',
                {
                    credentials: 'include'
                }
            );


        if (!respuesta.ok) {

            window.location.href =
                'index.html';

            return null;

        }


        const datos =
            await respuesta.json();


        return datos.usuario;


    } catch (error) {

        console.error(
            'Error al comprobar sesión:',
            error
        );


        window.location.href =
            'index.html';


        return null;

    }

}


// =====================================
// CERRAR SESIÓN
// =====================================

async function cerrarSesion() {

    try {

        const respuesta =
            await fetch(
                '/api/auth/logout',
                {
                    method: 'POST',

                    credentials: 'include'
                }
            );


        if (respuesta.ok) {

            window.location.href =
                'index.html';

            return;

        }


        const resultado =
            await respuesta.json();


        alert(
            resultado.mensaje ||
            'No se pudo cerrar la sesión'
        );


    } catch (error) {

        console.error(
            'Error al cerrar sesión:',
            error
        );


        alert(
            'Error al cerrar la sesión'
        );

    }

}


// =====================================
// AGREGAR BOTÓN AL SIDEBAR
// =====================================

function agregarBotonCerrarSesion() {

    const sidebar =
        document.querySelector(
            '.sidebar'
        );


    if (!sidebar) {

        return;

    }


    // Evitar crear el botón dos veces

    if (
        document.getElementById(
            'botonCerrarSesion'
        )
    ) {

        return;

    }


    const boton =
        document.createElement(
            'button'
        );


    boton.id =
        'botonCerrarSesion';


    boton.type =
        'button';


    boton.textContent =
        'Cerrar sesión';


    boton.addEventListener(
        'click',
        cerrarSesion
    );


    sidebar.appendChild(
        boton
    );

}


// =====================================
// INICIAR
// =====================================

async function iniciarSesionGeneral() {

    const usuario =
        await comprobarSesionGeneral();


    if (!usuario) {

        return;

    }


    agregarBotonCerrarSesion();

}


iniciarSesionGeneral();