import { NextResponse } from "next/server";
import Nina from "../service/nina";
import { GetTaskCounter, TaskCounter } from "../service/taskCounter";

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender, message } = body;

    if (!sender || typeof sender !== "string") {
      return NextResponse.json(
        { error: 'Parameter "sender" wajib diisi dengan teks murni.' },
        { status: 400 },
      );
    }
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: 'Parameter "message" wajib diisi dengan teks murni.' },
        { status: 400 },
      );
    }

    let isFinished = false;

    const ninaAgentResult = await Nina({
      sender: sender.trim(),
      message: message.trim(),
      finally: () => {
        isFinished = true;
        console.log(
          `[Nina Log] Pemrosesan untuk ${sender} telah selesai mengeksekusi blok finally.`,
        );
      },
    });

    if (!ninaAgentResult) {
      return NextResponse.json(
        { error: "Gagal mendapatkan respons dari Nina." },
        { status: 500 },
      );
    }

    if (ninaAgentResult.action && ninaAgentResult.action.length > 0) {
      for (const act of ninaAgentResult.action) {
        if (act.endpoint === "task-counter") {
          console.log(
            `[System Action] Mengeksekusi TaskCounter untuk Inisial: ${act.param1}`,
          );
          const updateDatabase = await TaskCounter({
            inisial: act.param1,
            nama: act.param2,
            jumlah: act.param3,
          });
          if (updateDatabase.success) {
            console.log(
              `[Database Success] Counter untuk ${act.param1} berhasil di-update ke angka: ${updateDatabase.total_tasks}`,
            );
            ninaAgentResult.message_response += `\n\n${await GetTaskCounter()}`;
          } else {
            console.error(
              `[Database Error] Gagal memperbarui tabel task_counter untuk ${act.param1}`,
            );
          }
        }
      }
    }

    if (!ninaAgentResult) {
      return NextResponse.json(
        { error: "Gagal mendapatkan analisis terstruktur dari Nina." },
        { status: 500 },
      );
    }

    const response = NextResponse.json(ninaAgentResult);

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  } catch (error) {
    console.error("API Error:", error);
    const errRes = NextResponse.json(
      { error: "Terjadi kegagalan pada internal server." },
      { status: 500 },
    );
    errRes.headers.set("Access-Control-Allow-Origin", "*");
    return errRes;
  }
}
