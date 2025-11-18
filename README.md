# Reto Técnico - Líder de TI (Sinapsis)

Este repositorio contiene la solución al reto técnico para la posición de **Líder de TI**, dividido en:

- **Ejercicio 1: Caso de Arquitectura** (carpeta `arquitectura/`).
- **Ejercicio 2: Ejercicio Técnico Práctico** (carpeta `nest-api/` y `lambdas/`).



## Arquitectura (Ejercicio 2)

Flujo completo:

1. El cliente invoca directamente el endpoint HTTP con el microservicio **NestJS** desplegado en AWS **Elastic Beanstalk**:

   - Endpoint NestJS interno: `/messages/send`
   - http://sinapsis-messaging-api-env.eba-akg2pqd4.us-east-1.elasticbeanstalk.com/messages/send

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
