// src/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  getRoot() {
    // Para el health check por defecto de Elastic Beanstalk (GET /)
    return { status: 'ok' };
  }

  @Get('health')
  getHealth() {
    // Health explícito si quieres usar /health como ruta
    return { status: 'ok' };
  }
}
