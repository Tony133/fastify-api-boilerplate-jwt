import * as argon2 from "argon2";

export class HashingService {
  private readonly options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  } as const;

  public async hash(data: string | Buffer): Promise<string> {
    return await argon2.hash(data, this.options);
  }

  public async compare(
    data: string | Buffer,
    encrypted: string
  ): Promise<boolean> {
    return await argon2.verify(encrypted, data);
  }
}
