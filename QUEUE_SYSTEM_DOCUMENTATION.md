# Queue Care - Queue & Token Management System Documentation

This document provides a detailed explanation of the architecture, database schema, backend algorithms, and frontend integration of the Queue Care Token Management System.

---

## 1. System Overview

Queue Care is designed to optimize patient waiting times at clinics and hospitals by replacing traditional static appointments with a **dynamic queuing workflow**. 

When a patient books a time slot for a doctor:
1. They are assigned a sequential **Queue Position (Token)** for that specific date and time slot.
2. The system computes their **Estimated Wait Time** based on the number of patients ahead of them.
3. As the patient arrives at the clinic and progresses through their checkup, their status moves through a linear **Status Timeline** from `Booked` to `Completed`.

---

## 2. Database Schema (`appointments` Table)

The appointment records store all data related to the queue state. The schema is defined in `backend/db/migrations/0004_create_hospital_doctor_appointment.sql`:

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `appointment_date` | `DATE NOT NULL` | The scheduled date of the checkup. |
| `appointment_time` | `VARCHAR(20) NOT NULL` | The selected time slot (e.g., `"09:00 AM"`, `"10:30 AM"`). |
| `queue_position` | `INT NOT NULL DEFAULT 0` | The patient's token number (starts at 1). |
| `estimated_wait` | `INT NOT NULL DEFAULT 0` | Estimated wait time in minutes. |
| `slot_capacity` | `INT NOT NULL DEFAULT 10` | Max appointments allowed per slot (hardcoded to `5` in repository). |
| `booked_count` | `INT NOT NULL DEFAULT 0` | Number of bookings already made when this record was created. |
| `status` | `VARCHAR(50) NOT NULL` | The current step in the queue lifecycle. |

---

## 3. Backend Logic & Token Calculations

The booking and queue positioning logic resides in `backend/repository/appointment_repository.go` inside the `CreateAppointment` function:

### Step 1: Count Existing Slot Bookings
Before inserting the new booking, the database is queried to find how many active (non-cancelled) bookings are already scheduled for that specific doctor, date, and time slot:

```sql
SELECT COUNT(*) FROM appointments 
WHERE doctor_id = $1 
  AND appointment_date = $2 
  AND appointment_time = $3 
  AND status != 'Cancelled'
```

### Step 2: Queue Calculations
Using the returned `bookedCount`, the backend calculates the metrics:

```go
apt.SlotCapacity = 5
apt.BookedCount = bookedCount
apt.QueuePosition = bookedCount + 1
apt.EstimatedWait = bookedCount * 15 // 15 minutes average session length per patient
apt.Status = "Booked"
```

### Wait Time Matrix Example:
For a time slot like "09:00 AM" (with a 15-minute average session length):

| Booking Order | Queue Position (Token) | Patients Ahead | Estimated Wait Time |
| :---: | :---: | :---: | :---: |
| 1st Patient | `#1` | 0 | `0 * 15 = 0 mins` (See doctor immediately) |
| 2nd Patient | `#2` | 1 | `1 * 15 = 15 mins` |
| 3rd Patient | `#3` | 2 | `2 * 15 = 30 mins` |
| 4th Patient | `#4` | 3 | `3 * 15 = 45 mins` |
| 5th Patient | `#5` | 4 | `4 * 15 = 60 mins` |

---

## 4. Queue Lifecycle States (`STATUS_STATES`)

The patient's progression is managed through sequential status updates defined in `Queue-Care/src/screens/home/AppointmentDetailsScreen.tsx`:

```typescript
const STATUS_STATES = [
  'Booked',
  'Confirmed',
  'Checked In',
  'In Queue',
  'Consultation Started',
  'Completed'
];
```

### Workflow Steps:
```
 [1. Booked] ➔ [2. Confirmed] ➔ [3. Checked In] ➔ [4. In Queue] ➔ [5. Consultation Started] ➔ [6. Completed]
```

1. **Booked:** Initial state when the checkout is completed.
2. **Confirmed:** Clinic accepts the appointment.
3. **Checked In:** Patient arrives at the hospital, confirming physical presence.
4. **In Queue:** Patient is waiting in the active line outside the doctor's cabin.
5. **Consultation Started:** Patient is inside the room with the doctor.
6. **Completed:** Session ends. The appointment is closed, the token is cleared from the dashboard, and a medical report is generated in the database.

---

## 5. Frontend UI Representation

The mobile client (`Queue-Care` React Native app) uses this queue data to provide transparency:

*   **BookingSuccessScreen.tsx:** Renders a checkout receipt displaying:
    *   Token number: `#{queue_position}`
    *   Expected wait time: `~{estimated_wait} mins`
*   **AppointmentDetailsScreen.tsx:**
    *   Displays a high-fidelity card with **Queue Position** and **Estimated Wait**.
    *   Displays a vertical timeline tracking the `STATUS_STATES` list. Completed states get checked (`✓`), and the current state is highlighted as the **Active State** so the patient has live updates on their turn.
*   **HomeScreen.tsx & BookingsListScreen.tsx:**
    *   Filters `contextAppointments` to only display active, upcoming appointments (hiding completed or cancelled ones, as well as past dates).
