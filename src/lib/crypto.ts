import { createAdminClient } from "@/lib/supabase/admin";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

export async function encryptServiceRoleKey(plainKey: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("pgp_sym_encrypt", {
    data: plainKey,
    psw: ENCRYPTION_KEY,
  });
  if (error) throw new Error(`Encryption failed: ${error.message}`);
  return data as string;
}

export async function decryptServiceRoleKey(
  encryptedKey: string
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("pgp_sym_decrypt", {
    data: encryptedKey,
    psw: ENCRYPTION_KEY,
  });
  if (error) throw new Error(`Decryption failed: ${error.message}`);
  return data as string;
}
