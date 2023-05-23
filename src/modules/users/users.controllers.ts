import {FastifyReply, FastifyRequest} from 'fastify';
import {CreateUserBody} from './users.schemas';
import {SYSTEM_ROLES} from '../../config/permissions';
import {getRoleByName} from '../roles/roles.services';
import {
  assignRoleToUser,
  createUser,
  getUsersByApplication,
} from './users.services';

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
