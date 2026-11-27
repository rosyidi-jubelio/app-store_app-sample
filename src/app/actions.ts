'use server';

import { revalidatePath } from 'next/cache';

import { JubelioApiError } from '@/lib/jubelio/errors';
import { jubelioFor } from '@/lib/jubelio-app';
import { getSession } from '@/lib/session';

export type CreateJournalState = { ok: boolean; message: string } | null;

export async function createJournalAction(_prev: CreateJournalState, formData: FormData): Promise<CreateJournalState> {
  // Server Actions can be called with a direct POST, so check the session here too.
  const session = await getSession();
  if (!session) {
    return { ok: false, message: 'Session tidak ada atau sudah habis. Buka app lagi dari Jubelio.' };
  }

  const transactionDate = String(formData.get('transaction_date') ?? '').trim();
  const debitAccountId = Number(formData.get('debit_account_id'));
  const creditAccountId = Number(formData.get('credit_account_id'));
  const amount = Number(formData.get('amount'));
  const notes = String(formData.get('notes') ?? '').trim();

  if (!transactionDate) {
    return { ok: false, message: 'Tanggal wajib diisi.' };
  }
  if (
    !Number.isInteger(debitAccountId) ||
    debitAccountId < 1 ||
    !Number.isInteger(creditAccountId) ||
    creditAccountId < 1
  ) {
    return { ok: false, message: 'Akun debit dan akun kredit wajib diisi dengan account_id yang valid.' };
  }
  if (!(amount > 0)) {
    return { ok: false, message: 'Nominal harus lebih dari 0.' };
  }

  try {
    const jubelio = await jubelioFor(session.merchantId);
    const journal = await jubelio.createJournal({
      transaction_date: new Date(`${transactionDate}T00:00:00Z`).toISOString(),
      ...(notes ? { notes } : {}),
      lines: [
        { account_id: debitAccountId, debit: amount },
        { account_id: creditAccountId, credit: amount },
      ],
    });
    revalidatePath('/');
    return {
      ok: true,
      message: `POST /finance/journals berhasil: journal_id ${journal.journal_id} (${journal.journal_no})`,
    };
  } catch (err) {
    if (err instanceof JubelioApiError) {
      return { ok: false, message: `${err.message}${err.requestId ? ` (request_id: ${err.requestId})` : ''}` };
    }
    return { ok: false, message: err instanceof Error ? err.message : 'Gagal membuat jurnal.' };
  }
}
