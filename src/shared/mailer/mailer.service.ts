import * as nodemailer from 'nodemailer';

export interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
  logger: boolean;
  debug: boolean;
}

export class MailerService {
  private transporter: nodemailer.Transporter;
  private fromName: string;
  private fromEmail: string;

  constructor(config: MailerConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth.user && config.auth.pass ? config.auth : undefined,
      logger: config.logger,
      debug: config.debug
    });

    this.fromName = config.from.name;
    this.fromEmail = config.from.email;
  }

  public async sendMail(options: nodemailer.SendMailOptions): Promise<unknown> {
    return this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromEmail}>`,
      ...options
    });
  }
}
