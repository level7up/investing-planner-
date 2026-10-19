import type { Trade } from "@/lib/trades/types";
import { toTradeView } from "./trade-view";

interface TradeListProps {
  trades: readonly Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

interface TradeItemProps {
  trade: Trade;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

const COLUMNS = ["تاريخ الدخول", "السهم", "الحالة", "سعر الشراء", "الكمية", "وقف الخسارة", "الهدف", "سعر البيع", "الرسوم", "صافي الربح/الخسارة", "إجراءات"];

function TradeRow({ trade, onEdit, onDelete }: TradeItemProps) {
  const view = toTradeView(trade);
  return (
    <tr>
      <td>{view.date}</td>
      <td>
        <div className="sym">{trade.symbol}</div>
        {trade.reason && <div className="note" title={trade.reason}>{trade.reason}</div>}
      </td>
      <td><span className={`pill ${view.statusClass}`}>{view.statusLabel}</span></td>
      <td className="num">{view.buy}</td>
      <td className="num">{view.quantity}</td>
      <td className="num">{view.stop}</td>
      <td className="num">{view.target}</td>
      <td className="num">{view.sell}</td>
      <td className="num">{view.fees}</td>
      <td className={`num result ${view.result.className}`}>{view.result.text}</td>
      <td>
        <div className="row-actions">
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => onEdit(trade)} aria-label={`تعديل صفقة ${trade.symbol}`}>تعديل</button>
          <button className="btn btn-danger btn-sm" type="button" onClick={() => onDelete(trade)} aria-label={`حذف صفقة ${trade.symbol}`}>حذف</button>
        </div>
      </td>
    </tr>
  );
}

function TradeCard({ trade, onEdit, onDelete }: TradeItemProps) {
  const view = toTradeView(trade);
  const stats = [
    ["سعر الشراء", view.buy],
    ["الكمية", view.quantity],
    ["سعر البيع", view.sell],
    ["وقف الخسارة", view.stop],
    ["الهدف", view.target],
    ["الرسوم", view.fees],
  ];
  return (
    <article className="card">
      <div className="card-top">
        <div>
          <div className="card-meta">
            <span className="sym">{trade.symbol}</span>
            <span className={`pill ${view.statusClass}`}>{view.statusLabel}</span>
          </div>
          <p className="card-date">{view.date}</p>
        </div>
        <div className={`card-result ${view.result.className}`}>{view.result.text}</div>
      </div>
      <dl className="stats">
        {stats.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
      {trade.reason && <p className="card-note">{trade.reason}</p>}
      <div className="card-actions">
        <button className="btn btn-secondary" type="button" onClick={() => onEdit(trade)} aria-label={`تعديل صفقة ${trade.symbol}`}>تعديل</button>
        <button className="btn btn-danger" type="button" onClick={() => onDelete(trade)} aria-label={`حذف صفقة ${trade.symbol}`}>حذف</button>
      </div>
    </article>
  );
}

export function TradeList({ trades, onEdit, onDelete }: TradeListProps) {
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{COLUMNS.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {trades.map((trade) => <TradeRow key={trade.id} trade={trade} onEdit={onEdit} onDelete={onDelete} />)}
          </tbody>
        </table>
      </div>
      <div className="cards">
        {trades.map((trade) => <TradeCard key={trade.id} trade={trade} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
    </>
  );
}
