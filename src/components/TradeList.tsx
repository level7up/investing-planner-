import type { QuoteMap } from "@/lib/quotes/types";
import { ASSET_LABELS } from "@/lib/trades/status";
import type { Trade } from "@/lib/trades/types";
import { ALERT_LABELS, toTradeView, type TradeView } from "./trade-view";

interface TradeListProps {
  trades: readonly Trade[];
  quotes: QuoteMap;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

interface TradeItemProps {
  trade: Trade;
  view: TradeView;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

const COLUMNS = [
  "تاريخ الدخول",
  "السهم",
  "الحالة",
  "سعر الشراء",
  "الكمية",
  "القيمة الشرائية",
  "السعر الحالي",
  "وقف الخسارة",
  "الهدف",
  "سعر البيع",
  "الرسوم",
  "المخاطرة",
  "العائد/المخاطرة",
  "صافي الربح/الخسارة",
  "إجراءات",
];

function SymbolBadges({ trade, view }: { trade: Trade; view: TradeView }) {
  return (
    <>
      {trade.assetType === "gold_fund" && <span className="pill pill--gold">{ASSET_LABELS.gold_fund}</span>}
      {view.alert && <span className={`pill pill--alert-${view.alert}`}>{ALERT_LABELS[view.alert]}</span>}
    </>
  );
}

function CurrentPrice({ view }: { view: TradeView }) {
  if (!view.current) return <>—</>;
  return (
    <>
      {view.current.price}
      {view.current.change && <div className={`r-multiple ${view.current.changeClass}`}>{view.current.change}</div>}
    </>
  );
}

function Result({ view }: { view: TradeView }) {
  return (
    <>
      {view.result.text}
      {view.result.note && <div className="r-multiple">{view.result.note}</div>}
    </>
  );
}

function Actions({ trade, onEdit, onDelete, isSmall }: Omit<TradeItemProps, "view"> & { isSmall: boolean }) {
  const size = isSmall ? " btn-sm" : "";
  return (
    <>
      <button className={`btn btn-secondary${size}`} type="button" onClick={() => onEdit(trade)} aria-label={`تعديل صفقة ${trade.symbol}`}>تعديل</button>
      <button className={`btn btn-danger${size}`} type="button" onClick={() => onDelete(trade)} aria-label={`حذف صفقة ${trade.symbol}`}>حذف</button>
    </>
  );
}

function TradeRow({ trade, view, onEdit, onDelete }: TradeItemProps) {
  return (
    <tr>
      <td>{view.date}</td>
      <td>
        <div className="sym">{trade.symbol}<SymbolBadges trade={trade} view={view} /></div>
        {trade.reason && <div className="note" title={trade.reason}>{trade.reason}</div>}
      </td>
      <td><span className={`pill ${view.statusClass}`}>{view.statusLabel}</span></td>
      <td className="num">{view.buy}</td>
      <td className="num">{view.quantity}</td>
      <td className="num">{view.purchaseValue}</td>
      <td className="num"><CurrentPrice view={view} /></td>
      <td className="num">{view.stop}</td>
      <td className="num">{view.target}</td>
      <td className="num">{view.sell}</td>
      <td className="num">{view.fees}</td>
      <td className="num">{view.risk}</td>
      <td className="num">{view.rewardToRisk}</td>
      <td className={`num result ${view.result.className}`}><Result view={view} /></td>
      <td><div className="row-actions"><Actions trade={trade} onEdit={onEdit} onDelete={onDelete} isSmall /></div></td>
    </tr>
  );
}

function TradeCard({ trade, view, onEdit, onDelete }: TradeItemProps) {
  const stats = [
    ["سعر الشراء", view.buy],
    ["الكمية", view.quantity],
    ["القيمة الشرائية", view.purchaseValue],
    view.current ? ["السعر الحالي", view.current.price] : ["سعر البيع", view.sell],
    ["وقف الخسارة", view.stop],
    ["الهدف", view.target],
    ["الرسوم", view.fees],
    ["المخاطرة", view.risk],
    ["العائد/المخاطرة", view.rewardToRisk],
  ];
  return (
    <article className="card">
      <div className="card-top">
        <div>
          <div className="card-meta">
            <span className="sym">{trade.symbol}</span>
            <span className={`pill ${view.statusClass}`}>{view.statusLabel}</span>
            <SymbolBadges trade={trade} view={view} />
          </div>
          <p className="card-date">{view.date}</p>
        </div>
        <div className={`card-result ${view.result.className}`}><Result view={view} /></div>
      </div>
      <dl className="stats">
        {stats.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
      {trade.reason && <p className="card-note">{trade.reason}</p>}
      <div className="card-actions"><Actions trade={trade} onEdit={onEdit} onDelete={onDelete} isSmall={false} /></div>
    </article>
  );
}

export function TradeList({ trades, quotes, onEdit, onDelete }: TradeListProps) {
  const items = trades.map((trade) => ({ trade, view: toTradeView(trade, quotes) }));
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{COLUMNS.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {items.map(({ trade, view }) => <TradeRow key={trade.id} trade={trade} view={view} onEdit={onEdit} onDelete={onDelete} />)}
          </tbody>
        </table>
      </div>
      <div className="cards">
        {items.map(({ trade, view }) => <TradeCard key={trade.id} trade={trade} view={view} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
    </>
  );
}
