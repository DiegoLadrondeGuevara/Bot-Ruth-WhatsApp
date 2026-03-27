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

---
¡Todo listo! He implementado la lógica de Human Handoff y preparado el bot para el despliegue final:

Resumen de lo nuevo:
Atención Humana 🧑‍💼: El bot ahora se silencia automáticamente si el cliente pide ayuda o escribe a un "asesor". Se reactiva solo tras 24h o con el comando "activar bot".
Número Vinculado 📱: Ya está configurado con tu nuevo número 959592971 en el archivo .env.
Catálogos y URLs 🌸: Corregido el problema de los PDFs (por la "ñ") y añadido el menú del Día de la Madre con tono amigable.
¿Qué te toca a ti?
He dejado un 
deployment_plan.md
 con los pasos exactos para subir el código a tu EC2 y configurar el API Gateway para el HTTPS. No olvides subir tus credenciales de Google Sheets para que los pedidos se sigan guardando.

¡Mucho éxito con el despliegue! Puedes ver todo el detalle en el 
walkthrough.md
.

---
Deployment & WABA Strategy - Dulce Ruth Bot
This document outlines the steps to move the bot from local development to a production environment on AWS EC2 and integrate it with a real WhatsApp number via YCloud.

1. Deployment Architecture (HTTPS via API Gateway)
Since YCloud requires an HTTPS webhook and your EC2 instance exposes HTTP, using Amazon API Gateway as a bridge is an excellent choice.

Steps to implement:
EC2 Security Group: Ensure port 3001 (or your configured PORT) is open to the public or at least to API Gateway's IP ranges.
API Gateway:
Create a "REST API" or "HTTP API".
Create a "Proxy Resource" (/{proxy+}) or a specific path for /webhook.
Set the Integration Type to HTTP and point it to your EC2's public IP/DNS: http://[EC2_IP]:3001/webhook/whatsapp.
Deploy the API to a stage (e.g., prod).
YCloud: Update your Webhook URL in the YCloud dashboard to the new API Gateway HTTPS URL: https://[API_ID].execute-api.[REGION].amazonaws.com/prod/webhook/whatsapp.
Alternative (Self-Managed):
If you prefer not to use API Gateway, you can install NGINX on the EC2 and use Certbot (Let's Encrypt) to get a free SSL certificate directly for your domain.

2. Real Number Registration (WABA)
To use the number +51959592971 in YCloud:

The Process:
Migration: You must "migrate" the number from the WhatsApp Business App to the WhatsApp Business API (WABA).
YCloud Dashboard:
Go to "WhatsApp" -> "Phone Numbers" -> "Add Phone Number".
Follow the "Embedded Signup" flow which will link your Facebook Business Manager.
The "API vs App" Rule:
WARNING

Important: Once a number is active on the API (YCloud), you cannot use the original WhatsApp Business App on your phone with that same number. The App will log out.

How to handle human "Asesores":
Since you can't use the App, how do humans reply?

YCloud Inbox: YCloud provides a chat interface in their dashboard where humans can see messages and reply.
External CRM: You can connect your WABA to platforms like Respond.io, Kommo (amoCRM), or Bitrix24. These allow both the bot and humans to work in the same number.
Custom Inbox: You could build a small dashboard that uses the YCloud API to send/receive messages.
3. Production Checklist
 Update 
.env
 with NODE_ENV=production.
 Ensure DATABASE_URL points to a persistent RDS or a managed Postgres instance.
 Upload credentials/google-sheets-key.json to the EC2 instance.
 Use pm2 start ecosystem.config.js --env production to keep the bot running.