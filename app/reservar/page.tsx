import { requireModule } from "@/core/config";

function ReservationsPage() {
  requireModule("reservations");
  return (
    <main>
      <h1>Reservas</h1>
      <p>Proximamente</p>
    </main>
  );
}

export default ReservationsPage;
