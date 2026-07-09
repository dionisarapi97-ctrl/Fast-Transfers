export default function BookingSummary({
  pickup,
  dropoff,
  routeInfo,
  vehicle,
  price,
  passengers,
  luggage,
  date,
  time,
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4">
        Booking Summary
      </h3>

      <div className="space-y-2 text-sm">

        <p>
          <strong>Pickup:</strong> {pickup?.address}
        </p>

        <p>
          <strong>Destination:</strong> {dropoff?.address}
        </p>

        <p>
          <strong>Distance:</strong> {routeInfo?.distanceText}
        </p>

        <p>
          <strong>Travel time:</strong> {routeInfo?.durationText}
        </p>

        <p>
          <strong>Date:</strong> {date || "-"}
        </p>

        <p>
          <strong>Time:</strong> {time || "-"}
        </p>

        <p>
          <strong>Passengers:</strong> {passengers}
        </p>

        <p>
          <strong>Luggage:</strong> {luggage}
        </p>

        <p>
          <strong>Vehicle:</strong> {vehicle?.name}
        </p>

        <hr />

        <p className="text-2xl font-bold text-emerald-600">
          €{price}
        </p>

      </div>
    </div>
  );
}