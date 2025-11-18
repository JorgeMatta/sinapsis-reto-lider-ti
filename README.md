# Reto Técnico - Líder de TI (Sinapsis)

Este repositorio contiene la solución al reto técnico para la posición de **Líder de TI**, dividido en:

- **Ejercicio 1: Caso de Arquitectura** (carpeta `arquitectura/`).
- **Ejercicio 2: Ejercicio Técnico Práctico** (carpeta `nest-api/` y `lambdas/`).


## 1. Caso de Arquitectura
A nivel de arquitectura lógica, la solución propuesta para el envío de mensajes (SMS / WhatsApp simulado) se basa en:

- Un microservicio stateless en NestJS expuesto públicamente.
- Colas SQS para desacoplar la recepción del mensaje del procesamiento.
- AWS Lambda para el procesamiento asíncrono.
- RDS MySQL para la persistencia y trazabilidad del estado del mensaje.

La arquitectura podría evolucionar así:

1. **Escalabilidad**
   - Aplicación stateless (NestJS) en Elastic Beanstalk
      - La app se despliega en Elastic Beanstalk (Node.js) detrás de un load balancer.
      - Al ser stateless, se puede escalar horizontalmente agregando más instancias según la demanda.

   - Colas SQS como buffer
      - SQS desacopla la recepción del mensaje del procesamiento.
      - Es posible aumentar el número de Lambdas consumidoras para procesar mensajes en paralelo sin impactar al endpoint de entrada.

   - RDS MySQL escalable
      - Para un entorno productivo se puede habilitar:
         - Multi-AZ para alta disponibilidad.
         - Read replicas para reportes/consultas pesadas sin cargar la base principal.

2. **Tolerancia a fallos**
   - SQS y reintentos automáticos
      - Si una Lambda falla al procesar un mensaje, SQS reintenta automáticamente según la configuración.
      - Se pueden definir Dead-letter queues (DLQ) para mensajes que fallen repetidamente y evitar perder información.

   - Alta disponibilidad en la capa de cómputo
      - Elastic Beanstalk y Lambda se ejecutan sobre infraestructura multi-AZ (zonas de disponibilidad) en AWS, reduciendo el impacto de fallas aisladas.

   - Base de datos tolerante a fallos
      - Con RDS MySQL en configuración Multi-AZ se tiene un standby sincronizado listo para asumir en caso de caída del primario.

3. **Seguridad de datos**
   - Aislamiento de red
      - RDS y Lambdas deberían residir en subredes privadas dentro de una VPC, sin exposición directa a Internet.
      - Solo el frontend (Elastic Beanstalk) estaría expuesto públicamente.
   - Cifrado
      - En tránsito: todo el tráfico externo debería ir sobre HTTPS.
      - En reposo:
         - RDS con cifrado habilitado.
         - SQS cifrado con KMS (AWS Key Management Service).
   - Control de acceso (IAM)
      - Roles específicos por componente:
         - Rol de ejecución de Elastic Beanstalk con permisos mínimos para publicar en SQS.
         - Roles de Lambda con permisos mínimos para leer de SQS y acceder a RDS.

4. **Observabilidad (logs, métricas, alarmas)**
   - Logs centralizados
      - Logs de la aplicación NestJS y de las Lambdas enviados a CloudWatch Logs.

   - SQS:
      - ApproximateNumberOfMessagesVisible (mensajes en cola pendientes).
      - Mensajes enviados/borrados por intervalo.

   - RDS:
      - Uso de CPU.
      - Conexiones activas.

   - Alarmas (CloudWatch Alarms)
      - Notificaciones por SNS / email cuando:
         - La cola SQS supera cierto umbral de mensajes pendientes.
         - Las Lambdas presentan un porcentaje alto de errores.
         - RDS se acerca al límite de conexiones o uso de CPU elevado.




## 2. Ejercicio Técnico Práctico

Flujo completo:

1. El cliente invoca directamente el endpoint HTTP con el microservicio **NestJS** desplegado en AWS **Elastic Beanstalk**:

   - Endpoint NestJS interno: `/messages/send`
   - URL activa en AWS:
       http://sinapsis-messaging-api-env.eba-akg2pqd4.us-east-1.elasticbeanstalk.com/messages/send

2. El microservicio:

   - Recibe la petición en `/messages/send`.
   - Valida el cuerpo (`channel`, `to`, `body`) usando `class-validator`.
   - Encola un mensaje en **Amazon SQS** (`message-send-queue`).

3. Procesar mensaje - **Lambda `process-message`**:

   - Se dispara por mensajes en `message-send-queue`.
   - Inserta el registro en **RDS MySQL** (DB `messaging`, tabla `messages`) con estado `PENDING`.
   - Encola un segundo mensaje en `delivery-confirmation-queue` con un `DelaySeconds` de 30s.

4. Simula confirmacion - **Lambda `confirm-delivery`**:

   - Se dispara por mensajes en `delivery-confirmation-queue`.
   - Actualiza el estado del mensaje en MySQL a `DELIVERED`.

## Tecnologías principales

- **NestJS** 
- **Elastic Beanstalk**
- **Amazon SQS**
- **AWS Lambda**
- **Amazon RDS (MySQL)** 

## Estructura de carpetas

```text
Reto_Tecnico_lider/
├─ nest-api/
│  ├─ src/
│  │  ├─ app.module.ts
│  │  ├─ health.controller.ts
│  │  ├─ main.ts
│  │  ├─ messages/
│  │  │  ├─ messages.controller.ts
│  │  │  ├─ messages.module.ts
│  │  │  ├─ messages.service.ts
│  │  │  ├─ send-message.dto.ts
│  ├─ package.json
│  └─ ...
├─ lambdas/
│  ├─ confirm-delivery.ts
│  └─ process-message.ts
└─ README.md
```

 
## Probar el microservicio (Postman)
### Endpoint

POST http://sinapsis-messaging-api-env.eba-akg2pqd4.us-east-1.elasticbeanstalk.com/messages/send

Content-Type: application/json

### Body (raw → JSON)
{
  "channel": "WHATSAPP",
  "to": "+51999999999",
  "body": "Hola, este es un mensaje de prueba del reto."
}r

### Respuesta esperada

{
  "messageId": "a566e3df-27b9-444e-96f9-db62b69ab3d1",
  "status": "ENQUEUED",
  "message": "Mensaje recibido y enviado a la cola."
}
