import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[var(--app-surface)]">
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <Image
          src="/logo.svg"
          alt="Jubelio"
          width={144}
          height={34}
          priority
        />
        <Badge
          title="Sandbox"
          color="#4b68ef"
          showDot
        />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Jubelio App Sample</h1>
          <p className="text-muted-foreground text-sm">
            Contoh app pihak ketiga yang terhubung ke Jubelio Open API.
          </p>
        </div>

        <section className="flex flex-col gap-6 rounded-lg border bg-card p-6">
          <Tabs defaultValue="connect">
            <TabsList>
              <TabsTrigger value="connect">Koneksi</TabsTrigger>
              <TabsTrigger value="about">Tentang</TabsTrigger>
            </TabsList>
            <TabsContent value="connect">
              <div className="flex flex-col gap-4 pt-4">
                <Input
                  label="Nama toko"
                  placeholder="Masukkan nama toko"
                />
                <Separator />
                <div className="flex gap-3">
                  <Button>Hubungkan ke Jubelio</Button>
                  <Button variant="outline">Batal</Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="about">
              <p className="pt-4 text-sm">
                Memakai design system Jubelio Dev Console: token warna, font Nunito Sans, dan
                komponen shadcn berbasis Base UI.
              </p>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
