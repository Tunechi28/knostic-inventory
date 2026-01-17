import * as fs from 'fs';

import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { dump } from 'js-yaml';

export const generateSwaggerFile = (app: INestApplication): void => {
  const API_SPEC_PATH = '.openapi/specs.yml';

  const options = new DocumentBuilder()
    .setTitle('Inventory Management API')
    .setDescription('API documentation for the Inventory Management System')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .setContact('Support', '', 'support@example.com')
    .addServer('http://localhost:4000/api', 'localhost', {})
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    ignoreGlobalPrefix: true,
  });

  SwaggerModule.setup('open-api-specs', app, document);

  const yamlDocument = dump(document, {
    indent: 2,
    lineWidth: 120,
    quotingType: '"',
  });
  fs.writeFileSync(API_SPEC_PATH, yamlDocument, {});
};
