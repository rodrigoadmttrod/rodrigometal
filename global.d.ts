declare module "bcryptjs" {
  function genSaltSync(rounds?: number): string;
  function hashSync(data: string, salt: string): string;
  function compareSync(data: string, encrypted: string): boolean;
  function genSalt(rounds?: number): Promise<string>;
  function hash(data: string, salt: string): Promise<string>;
  function compare(data: string, encrypted: string): Promise<boolean>;
  export = {
    genSaltSync,
    hashSync,
    compareSync,
    genSalt,
    hash,
    compare,
  };
}
