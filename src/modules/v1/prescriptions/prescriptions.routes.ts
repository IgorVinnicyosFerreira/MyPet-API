import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { makePrescriptionsController } from './prescriptions.factory';
import {
  doseRecordBodySchema,
  doseRecordSchema,
  medicationAgendaParamSchema,
  medicationAgendaQuerySchema,
  medicationAgendaSchema,
  prescriptionBodySchema,
  prescriptionIdParamSchema,
  prescriptionSchema,
  prescriptionUpdateBodySchema,
} from './prescriptions.schemas';

const prescriptionsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    '/prescriptions',
    {
      preHandler: fastify.authenticate,
      schema: {
        body: prescriptionBodySchema,
        response: {
          201: prescriptionSchema,
        },
      },
    },
    (req, reply) => makePrescriptionsController().create(req, reply),
  );

  fastify.patch(
    '/prescriptions/:prescriptionId',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: prescriptionIdParamSchema,
        body: prescriptionUpdateBodySchema,
        response: {
          200: prescriptionSchema,
        },
      },
    },
    (req, reply) => makePrescriptionsController().update(req, reply),
  );

  fastify.post(
    '/prescriptions/:prescriptionId/dose-records',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: prescriptionIdParamSchema,
        body: doseRecordBodySchema,
        response: {
          201: doseRecordSchema,
        },
      },
    },
    (req, reply) => makePrescriptionsController().createDoseRecord(req, reply),
  );

  fastify.get(
    '/pets/:petId/medication-agenda',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: medicationAgendaParamSchema,
        querystring: medicationAgendaQuerySchema,
        response: {
          200: medicationAgendaSchema,
        },
      },
    },
    (req, reply) => makePrescriptionsController().listAgenda(req, reply),
  );
};

export { prescriptionsRoutes };
