const loginForm =
    document.getElementById('loginForm');

const correoInput =
    document.getElementById('correo');

const passwordInput =
    document.getElementById('password');

const mensaje =
    document.getElementById('mensajeLogin');


loginForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();

        mensaje.textContent =
            'Ingresando...';

        try {

            const respuesta =
                await fetch(
                    '/api/auth/login',
                    {
                        method: 'POST',

                        credentials: 'include',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({

                                correo:
                                    correoInput
                                        .value
                                        .trim(),

                                password:
                                    passwordInput
                                        .value

                            })

                    }
                );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                mensaje.textContent =
                    resultado.mensaje ||
                    'No se pudo iniciar sesión';

                return;

            }


            if (
                resultado.usuario.rol ===
                'administrador'
            ) {

                window.location.href =
                    'dashboard.html';

            } else {

                window.location.href =
                    'ventas.html';

            }

        } catch (error) {

            console.error(error);

            mensaje.textContent =
                'Error al conectar con el servidor';

        }

    }
);