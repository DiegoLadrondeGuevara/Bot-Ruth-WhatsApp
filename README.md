Walkthrough - Dulce Ruth Bot Update
I have updated the Dulce Ruth WhatsApp bot with the new Mother's Day catalog, updated professional PDF links, and a friendlier tone.

Changes Made
1. New Menu and Catalogs
The main menu now includes a new option for the Catálogo Día de la Madre 🌸. The Catálogo de Pascua 🐰 link has been updated to a professional PDF hosted on your S3 bucket.

Option 2️⃣: Catálogo de Pascua (campanha_pascua.pdf)
Option 3️⃣: Catálogo Día de la Madre (campanha_diadelamadre.pdf)
2. Improved Tone and Emojis
I have modified the welcome message and various interaction stages to be warmer and more personal.

Welcome: "¡Hola! 🌸 Qué alegría saludarte. Te damos la bienvenida a Dulce Ruth..."
Personalized greetings: "¡Un gusto saludarte, [Nombre]! ✨"
Helpful prompts: "¡Qué lindo detalle! 🌸 Aquí tienes nuestro Catálogo Día de la Madre..."
3. Updated S3 Assets
All image and PDF links have been updated to point to your new S3 bucket: https://bot-whatsapp-ruth.s3.us-east-2.amazonaws.com/.

Paths for shipping steps, important info, and promos have been corrected.
5. Human Handoff (Atención Humana)
He implementado una lógica robusta para que puedas atender a tus clientes sin que el bot interfiera:

Activación: Si el cliente escribe palabras como "asesor", "humano", "ayuda", el bot se desactivará para ese número y enviará una alerta.
Silencio del Bot: Una vez desactivado, el bot ignorará todos los mensajes del cliente, permitiendo que respondas libremente desde el Inbox de YCloud.
Reactivación Manual: Puedes reactivar el bot para un cliente escribiendo el comando "activar bot" en el chat.
Auto-Reactivación: Si pasan 24 horas de inactividad, el bot se reactivará solo para estar listo para la siguiente consulta.
6. Configuración de Producción
Nuevo Número: El bot ahora está configurado para el número +51959592971.
Base de Datos: Se ha añadido la columna is_bot_active a la tabla de clientes con una migración automática.
Próximos Pasos para Ti
Despliegue: Sigue el 
deployment_plan.md
 para subir el bot a tu EC2.
Credenciales: Recuerda subir el archivo credentials/google-sheets-key.json a la carpeta correspondiente en el servidor para que el registro en Excel funcione.
Webhook: Configura la URL de tu API Gateway en el panel de YCloud.

