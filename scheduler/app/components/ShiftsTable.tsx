type Shift = {
  id: string;
  owner_id: string;
  position_id: string;
  start_time: string;
  end_time: string;
  status: string;
};

type Props = {
  shifts: Shift[];
  profileMap: Record<string, string>;
  positionMap: Record<string, string>;
};

export default function ShiftsTable({ shifts, profileMap, positionMap }: Props) {
  return (
    <>
      <h1>Shifts</h1>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Position</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((shift) => (
            <tr key={shift.id}>
              <td>{profileMap[shift.owner_id] ?? shift.owner_id}</td>
              <td>{positionMap[shift.position_id] ?? shift.position_id}</td>
              <td>{new Date(shift.start_time).toLocaleString()}</td>
              <td>{new Date(shift.end_time).toLocaleString()}</td>
              <td>{shift.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
