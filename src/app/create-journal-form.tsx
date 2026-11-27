'use client';

import { useActionState } from 'react';

import { type CreateJournalState, createJournalAction } from '@/app/actions';
import { Button } from '@/components/ui/button';

const INPUT_CLASS = 'h-10 rounded-md border bg-background px-3';

export function CreateJournalForm() {
  const [state, formAction, pending] = useActionState<CreateJournalState, FormData>(createJournalAction, null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3"
    >
      <h3 className="font-semibold">Buat jurnal manual (POST /finance/journals)</h3>
      <p className="text-muted-foreground text-xs">
        Satu baris debit dan satu baris kredit dengan nominal yang sama. Ambil account_id dari hasil GET
        /finance/accounts di bawah.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Tanggal</span>
          <input
            name="transaction_date"
            type="date"
            required
            defaultValue={today}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Nominal</span>
          <input
            name="amount"
            type="number"
            min="1"
            step="any"
            required
            placeholder="15000"
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Akun debit (account_id)</span>
          <input
            name="debit_account_id"
            type="number"
            min="1"
            required
            placeholder="48"
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Akun kredit (account_id)</span>
          <input
            name="credit_account_id"
            type="number"
            min="1"
            required
            placeholder="114"
            className={INPUT_CLASS}
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Catatan (opsional)</span>
          <input
            name="notes"
            maxLength={500}
            placeholder="Biaya admin bank"
            className={INPUT_CLASS}
          />
        </label>
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="self-start"
      >
        {pending ? 'Menyimpan...' : 'Buat jurnal'}
      </Button>
      {state && <p className={state.ok ? 'text-green-700' : 'text-destructive'}>{state.message}</p>}
    </form>
  );
}
