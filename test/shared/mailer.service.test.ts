import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import net from 'node:net';
import { MailerService, MailerConfig } from '../../src/shared/mailer/mailer.service';

/**
 * A minimal in-process SMTP server: it greets, advertises AUTH, accepts every
 * command and records the message DATA, so the real nodemailer transport can be
 * exercised end-to-end without any network access.
 */
function startFakeSmtpServer() {
  const received: string[] = [];
  const authCommands: string[] = [];

  const server = net.createServer((socket) => {
    let inData = false;
    let buffer = '';
    socket.write('220 fake ESMTP\r\n');
    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      let idx: number;
      while ((idx = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (inData) {
          if (line === '.') {
            inData = false;
            socket.write('250 OK queued as 42\r\n');
          } else {
            received.push(line);
          }
          continue;
        }
        const command = line.split(' ')[0].toUpperCase();
        if (command === 'EHLO') socket.write('250-fake\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n');
        else if (command === 'AUTH') { authCommands.push(line); socket.write('235 Authentication successful\r\n'); }
        else if (command === 'DATA') { inData = true; socket.write('354 go ahead\r\n'); }
        else if (command === 'QUIT') { socket.write('221 bye\r\n'); socket.end(); }
        else socket.write('250 OK\r\n');
      }
    });
  });

  return {
    received,
    authCommands,
    listen: () => new Promise<number>((resolve) =>
      server.listen(0, '127.0.0.1', () => resolve((server.address() as net.AddressInfo).port))
    ),
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  };
}

describe('MailerService', () => {
  const smtp = startFakeSmtpServer();
  let port: number;

  before(async () => { port = await smtp.listen(); });
  after(async () => { await smtp.close(); });

  const baseConfig = (): MailerConfig => ({
    host: '127.0.0.1',
    port,
    secure: false,
    auth: { user: '', pass: '' },
    from: { name: 'App Fastify', email: 'noreply@example.com' },
    logger: false,
    debug: false
  });

  test('sendMail - should deliver the message with the configured From header (no auth)', async () => {
    smtp.received.length = 0;
    smtp.authCommands.length = 0;
    const mailer = new MailerService(baseConfig());

    const info = (await mailer.sendMail({
      to: 'user@example.com',
      subject: 'Password reset',
      text: 'Your temporary password is: abc123'
    })) as { accepted: string[]; rejected: string[] };

    assert.deepStrictEqual(info.accepted, ['user@example.com']);
    assert.deepStrictEqual(info.rejected, []);
    assert.ok(smtp.received.some((l) => l === 'From: App Fastify <noreply@example.com>'));
    assert.ok(smtp.received.some((l) => l === 'Subject: Password reset'));
    assert.ok(smtp.received.some((l) => l.includes('abc123')));
    assert.strictEqual(smtp.authCommands.length, 0, 'must not authenticate without credentials');
  });

  test('sendMail - should authenticate when credentials are configured', async () => {
    smtp.received.length = 0;
    smtp.authCommands.length = 0;
    const mailer = new MailerService({ ...baseConfig(), auth: { user: 'smtp_user', pass: 's3cret' } });

    await mailer.sendMail({ to: 'user@example.com', subject: 'Hi', text: 'hello' });

    assert.strictEqual(smtp.authCommands.length, 1);
    assert.ok(smtp.authCommands[0].startsWith('AUTH '));
  });

  test('sendMail - should let the caller override the From header', async () => {
    smtp.received.length = 0;
    const mailer = new MailerService(baseConfig());

    await mailer.sendMail({ from: 'Other <other@example.com>', to: 'user@example.com', subject: 'x', text: 'y' });

    assert.ok(smtp.received.some((l) => l === 'From: Other <other@example.com>'));
  });
});
