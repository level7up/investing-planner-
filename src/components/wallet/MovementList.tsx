import { formatDate, formatMoney, formatSignedMoney, toneOf } from "@/lib/trades/format";
import type { Movement, MovementKind } from "@/lib/wallet/types";

interface MovementListProps {
  movements: readonly Movement[];
  onDelete: (movement: Movement) => void;
}

const KIND_LABELS: Record<MovementKind, string> = {
  deposit: "إيداع",
  withdrawal: "سحب",
  buy: "شراء",
  sell: "بيع",
  "gold-buy": "شراء ذهب",
  "gold-sell": "بيع ذهب",
};

const describe = (movement: Movement): string =>
  movement.subject ? `${KIND_LABELS[movement.kind]} · ${movement.subject}` : KIND_LABELS[movement.kind];

function DeleteButton({ movement, onDelete }: { movement: Movement; onDelete: (movement: Movement) => void }) {
  if (!movement.isManual) return <span className="muted movement-auto">تلقائي</span>;
  return (
    <button className="btn btn-danger btn-sm" type="button" onClick={() => onDelete(movement)} aria-label={`حذف ${describe(movement)}`}>
      حذف
    </button>
  );
}

export function MovementList({ movements, onDelete }: MovementListProps) {
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th><th>الرصيد</th><th>إجراءات</th></tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td>{formatDate(movement.date)}</td>
                <td>{describe(movement)}</td>
                <td className={`num result ${toneOf(movement.amount)}`}>{formatSignedMoney(movement.amount)}</td>
                <td className={`num ${movement.balance < 0 ? "loss" : ""}`}>{formatMoney(movement.balance)}</td>
                <td><DeleteButton movement={movement} onDelete={onDelete} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cards">
        {movements.map((movement) => (
          <article key={movement.id} className="card movement-card">
            <div className="card-top">
              <div>
                <span className="sym movement-title">{describe(movement)}</span>
                <p className="card-date">{formatDate(movement.date)} · الرصيد {formatMoney(movement.balance)}</p>
              </div>
              <div className={`card-result ${toneOf(movement.amount)}`}>{formatSignedMoney(movement.amount)}</div>
            </div>
            {movement.isManual && (
              <div className="movement-actions"><DeleteButton movement={movement} onDelete={onDelete} /></div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
