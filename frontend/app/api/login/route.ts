import { NextResponse } from "next/server";
import usersData from "@/data/users.json";

const accessMap: Record<string, string> = {
  "5": "Администратор",
  "4": "Менеджер",
  "3": "Сотрудник",
  "2": "Пользователь",
  "1": "Гость",
};

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();

    const user = usersData.users.find(
      (u) => u.login === login && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        login: user.login,
        access: user.access,
        role: accessMap[user.access] || "Пользователь",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Ошибка сервера" },
      { status: 500 }
    );
  }
}