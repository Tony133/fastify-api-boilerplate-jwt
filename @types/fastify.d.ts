import "fastify";
import { Kysely } from 'kysely';
import { Database } from "../src/modules/users/users.model";
import { AuthenticationService } from '../src/modules/authentication/authentication.service';
import { RegisterService } from '../src/modules/register/register.service';
import { UsersService } from '../src/modules/users/users.service';
import { ChangePasswordService } from '../src/modules/change-password/change-password.service';
import { Role } from '../src/shared/enums/role.enum';
import { HashingService } from '../src/shared/hashing/hashing.service';
import { ForgotPasswordService } from "../src/modules/forgot-password/forgot-password.service";
import { Config } from "../src/plugins/config.plugin";
import { FastifyReply, FastifyRequest } from 'fastify';
import { MailerService } from '../src/shared/mailer/mailer.service';

declare module "fastify" {
  interface FastifyInstance {
    authenticationService: AuthenticationService;
    registerService: RegisterService;
    usersService: UsersService;
    changePasswordService: ChangePasswordService;
    forgotPasswordService: ForgotPasswordService;
    hashingService: HashingService;
    database: Kysely<Database>;
    mailerService: MailerService;
    config: Config;
    checkToken: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    checkRole: (
      requiredRole: string
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user: {
      sub: string;
      name: string;
      email: string;
      role: Role;
    };
  }

  interface Payload {
    userId: string;
  }

}
