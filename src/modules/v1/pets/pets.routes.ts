import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4-mini';
import { makePetsController } from './pets.factory';
import {
  clinicalRecordSchema,
  clinicalRecordUpdateBodySchema,
  consultationBodySchema,
  errorResponseSchema,
  examBodySchema,
  feedingBodySchema,
  petByIdParamSchema,
  petCreateBodySchema,
  petIdParamSchema,
  petSchema,
  petUpdateBodySchema,
  petUpdateParamSchema,
  petWithHealthSummarySchema,
  recordTypeParamSchema,
  sanitaryBodySchema,
  vaccinationBodySchema,
  weightBodySchema,
} from './pets.schemas';

const genericRecordSchema = z.record(z.string(), z.unknown());

const petsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        body: petCreateBodySchema,
        response: {
          201: petSchema,
        },
      },
    },
    (req, reply) => makePetsController().createPet(req, reply),
  );

  fastify.get(
    '/',
    {
      preHandler: fastify.authenticate,
      schema: {
        response: {
          200: z.array(petSchema),
        },
      },
    },
    (req, reply) => makePetsController().listPets(req, reply),
  );

  fastify.get(
    '/:petId',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: petByIdParamSchema,
        response: {
          200: petWithHealthSummarySchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    (req, reply) => makePetsController().getPetById(req, reply),
  );

  fastify.patch(
    '/:petId',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: petUpdateParamSchema,
        body: petUpdateBodySchema,
        response: {
          200: petSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    (req, reply) => makePetsController().updatePetById(req, reply),
  );

  fastify.post(
    '/:petId/feedings',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: petIdParamSchema,
        body: feedingBodySchema,
        response: {
          201: genericRecordSchema,
        },
      },
    },
    (req, reply) => makePetsController().createFeeding(req, reply),
  );

  fastify.post(
    '/:petId/weights',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: petIdParamSchema,
        body: weightBodySchema,
        response: {
          201: genericRecordSchema,
        },
      },
    },
    (req, reply) => makePetsController().createWeight(req, reply),
  );

  fastify.post(
    '/:petId/consultations',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: petIdParamSchema,
        body: consultationBodySchema,
        response: {
          201: genericRecordSchema,
        },
      },
    },
    (req, reply) => makePetsController().createConsultation(req, reply),
  );

  fastify.post(
    '/:petId/exams',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: petIdParamSchema,
        body: examBodySchema,
        response: {
          201: genericRecordSchema,
        },
      },
    },
    (req, reply) => makePetsController().createExam(req, reply),
  );

  fastify.post(
    '/:petId/vaccinations',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: petIdParamSchema,
        body: vaccinationBodySchema,
        response: {
          201: genericRecordSchema,
        },
      },
    },
    (req, reply) => makePetsController().createVaccination(req, reply),
  );

  fastify.post(
    '/:petId/sanitary-records',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: petIdParamSchema,
        body: sanitaryBodySchema,
        response: {
          201: genericRecordSchema,
        },
      },
    },
    (req, reply) => makePetsController().createSanitaryRecord(req, reply),
  );

  fastify.get(
    '/:petId/history',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: petIdParamSchema,
        response: {
          200: z.array(clinicalRecordSchema),
        },
      },
    },
    (req, reply) => makePetsController().listHistory(req, reply),
  );

  fastify.patch(
    '/:petId/history/:recordType/:recordId',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: recordTypeParamSchema,
        body: clinicalRecordUpdateBodySchema,
        response: {
          200: clinicalRecordSchema,
        },
      },
    },
    (req, reply) => makePetsController().updateClinicalRecord(req, reply),
  );
};

export { petsRoutes };
