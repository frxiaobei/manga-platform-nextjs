import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 201, ...init });
}

export function badRequest(message: string) {
  return NextResponse.json({ detail: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ detail: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ detail: message }, { status: 403 });
}

export function notFound(message: string) {
  return NextResponse.json({ detail: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ detail: message }, { status: 409 });
}

export function unprocessable(message: string) {
  return NextResponse.json({ detail: message }, { status: 422 });
}

export function serverError(message: string) {
  return NextResponse.json({ detail: message }, { status: 500 });
}
