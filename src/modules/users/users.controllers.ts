import {FastifyReply, FastifyRequest} from 'fastify';
import {AssignRoleToUserBody, CreateUserBody, LoginBody} from './users.schemas';
import {SYSTEM_ROLES} from '../../config/permissions';
import {getRoleByName} from '../roles/roles.services';
import {
  assignRoleToUser,
  createUser,
  getUserByEmail,
  getUsersByApplication,
} from './users.services';
import jwt from 'jsonwebtoken';
import {logger} from '../../utils/logger';

export async function createUserHandler(
  request: FastifyRequest<{
    Body: CreateUserBody;
  }>,
  reply: FastifyReply
) {
  const {initialUser, ...data} = request.body;

  const roleName = initialUser
    ? SYSTEM_ROLES.SUPER_ADMIN
    : SYSTEM_ROLES.APPLICATION_USER;

  if (roleName === SYSTEM_ROLES.SUPER_ADMIN) {
    const appUsers = await getUsersByApplication(data.applicationId);
    if (appUsers.length > 0) {
      return reply.status(400).send({
        error: 'SUPER_ADMIN already exists for this application',
        extensions: {
          code: 'APPLICATION_ALREADY_SUPER_USER',
          applicationId: data.applicationId,
        },
      });
    }
  }

  const role = await getRoleByName({
    name: roleName,
    applicationId: data.applicationId,
  });

  if (!role) {
    return reply.status(404).send({
      error: 'Role does not exist',
      extensions: {
        code: 'ROLE_NOTE_FOUND',
        roleName,
      },
    });
  }

  try {
    const user = await createUser(data);
    // assign role to user

    await assignRoleToUser({
      userId: user.id,
      roleId: role.id,
      applicationId: data.applicationId,
    });
    return user;
  } catch (error: any) {
    if (error.code === '23505') {
      return reply.status(400).send({
        error: 'User already exists',
        extensions: {
          code: 'USER_ALREADY_EXISTS',
          key: error.detail,
        },
      });
    }
    return reply.status(500).send({
      error: 'Something went wrong',
    });
    throw error;
  }
}

export async function loginHandler(
  request: FastifyRequest<{
    Body: LoginBody;
  }>,
  reply: FastifyReply
) {
  const {applicationId, email, password} = request.body;

  const user = await getUserByEmail({
    applicationId,
    email,
  });

  if (!user) {
    return reply.status(404).send({
      error: 'User not found',
      extensions: {
        code: 'USER_NOT_FOUND',
      },
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      applicationId,
      email,
      scopes: user.permissions,
    },
    'secret'
  ); //TODO: Change this

  return {
    token,
  };
}

export async function assignRoleToUserHandler(
  request: FastifyRequest<{
    Body: AssignRoleToUserBody;
  }>,
  reply: FastifyReply
) {
  const {userId, roleId} = request.body;

  const user = request.user;

  const applicationId = user.applicationId;
  try {
    const result = await assignRoleToUser({
      userId,
      roleId,
      applicationId,
    });
    return result;
  } catch (error) {
    logger.error(error, 'Error assigning role to user');

    return reply.status(500).send({
      error: 'Something went wrong',
    });
  }
}
