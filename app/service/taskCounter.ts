import { supabase } from "./supabase";

interface TaskCounterProps {
  inisial: string;
  nama: string;
  jumlah: string;
}

interface TaskCounterResult {
  total_tasks: number;
  success: boolean;
}

export async function GetTaskCounter() {
  let dbTaskCounterString = "Tidak ada data personel terdaftar.";
  try {
    const { data: dbData, error: dbError } = await supabase
      .from("task_counter")
      .select("inisial, nama, jumlah")
      .order("jumlah", { ascending: false });
    if (dbError) throw dbError;

    if (dbData && dbData.length > 0) {
      dbTaskCounterString = dbData
        .map(
          (row) => `- Nama: ${row.nama} (${row.inisial}) - ${row.jumlah} Task`,
        )
        .join("\n");
    }
  } catch (error) {
    console.error(
      "[Nina Database Fetch Error]: Gagal mengambil data task_counter.",
      error,
    );
    dbTaskCounterString = "Gagal memuat data dari database utama saat ini.";
  }
  return dbTaskCounterString;
}

export async function TaskCounter(
  props: TaskCounterProps,
): Promise<TaskCounterResult> {
  const cleanInitials = props.inisial.toUpperCase().trim();
  const parsedJumlahInput = parseInt(props.jumlah, 10);
  const validJumlahInput = isNaN(parsedJumlahInput) ? 0 : parsedJumlahInput;

  try {
    const { error: upsertError } = await supabase.from("task_counter").upsert(
      {
        inisial: cleanInitials,
        nama: props.nama.trim(),
        jumlah: validJumlahInput,
      },
      {
        onConflict: "inisial",
      },
    );

    if (upsertError) throw upsertError;

    return {
      total_tasks: validJumlahInput,
      success: true,
    };
  } catch (error) {
    console.error("[Supabase TaskCounter Error]:", error);
    return {
      total_tasks: 0,
      success: false,
    };
  }
}
