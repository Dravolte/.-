import { useEffect, useState } from "react";

const denominations = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05];

export default function CashRegister() {
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem("cash_balance");
    return saved ? parseFloat(saved) : 0;
  });
  const [bank, setBank] = useState(() => {
    const saved = localStorage.getItem("bank_balance");
    return saved ? parseFloat(saved) : 0;
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("cash_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [drawer, setDrawer] = useState(() => {
    const saved = localStorage.getItem("cash_drawer");
    return saved ? JSON.parse(saved) : Object.fromEntries(denominations.map(d => [d, 0]));
  });
  const [quantity, setQuantity] = useState(1);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [bankInput, setBankInput] = useState("");

  useEffect(() => {
    localStorage.setItem("cash_balance", balance.toString());
    localStorage.setItem("bank_balance", bank.toString());
    localStorage.setItem("cash_history", JSON.stringify(history));
    localStorage.setItem("cash_drawer", JSON.stringify(drawer));
  }, [balance, bank, history, drawer]);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.backgroundColor = "#121212";
  }, []);

  const playSound = () => {
    const audio = new Audio("https://www.soundjay.com/misc/sounds/cash-register-01.mp3");
    audio.play();
  };

  const formatCurrency = (value) => `${value.toFixed(2)} €`;

  const handleAdd = (value) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    const newDrawer = { ...drawer, [value]: drawer[value] + qty };
    setDrawer(newDrawer);
    const newBalance = parseFloat((balance + value * qty).toFixed(2));
    setBalance(newBalance);
    setHistory([
      {
        type: "add",
        amount: value * qty,
        detail: `${detail || ""} (${qty} x ${value.toFixed(2)} €)`,
        date: new Date().toLocaleString()
      },
      ...history,
    ]);
    setDetail("");
    playSound();
  };

  const handleRemove = (value) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    if (drawer[value] < qty) return;
    const newDrawer = { ...drawer, [value]: drawer[value] - qty };
    setDrawer(newDrawer);
    const newBalance = parseFloat((balance - value * qty).toFixed(2));
    setBalance(newBalance);
    setHistory([
      {
        type: "remove",
        amount: value * qty,
        detail: `${detail || ""} (${qty} x ${value.toFixed(2)} €)`,
        date: new Date().toLocaleString()
      },
      ...history,
    ]);
    setDetail("");
    playSound();
  };

  const handleBankUpdate = (amount, type) => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return;
    const newBank = type === "add" ? bank + parsed : bank - parsed;
    setBank(parseFloat(newBank.toFixed(2)));
    setHistory([
      {
        type: "bank-" + type,
        amount: parsed,
        detail: `Mouvement bancaire : ${type === "add" ? "ajout" : "retrait"}`,
        date: new Date().toLocaleString()
      },
      ...history,
    ]);
    setBankInput("");
  };

  const handleResetCaisse = () => {
    const code = prompt("Entrez le code pour réinitialiser la caisse");
    if (code !== "16092007") return alert("Code incorrect");
    setBalance(0);
    setDrawer(Object.fromEntries(denominations.map(d => [d, 0])));
    setHistory([
      {
        type: "reset",
        date: new Date().toLocaleString(),
        detail: "Réinitialisation de la caisse"
      },
      ...history,
    ]);
  };

  const handleClearHistory = () => {
    const code = prompt("Entrez le code pour effacer l'historique");
    if (code !== "16092007") return alert("Code incorrect");
    setHistory([]);
  };

  const filteredHistory = history.filter(h =>
    h.detail.toLowerCase().includes(filter.toLowerCase()) ||
    h.type.toLowerCase().includes(filter.toLowerCase())
  );

  const billets = denominations.filter(d => d >= 5);
  const pieces = denominations.filter(d => d < 5);

  const renderDrawer = (values) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#333', padding: '10px', borderRadius: '10px' }}>
      {values.map((value) => (
        <div key={value} style={{ background: '#1a1a1a', padding: '10px', borderRadius: '8px', textAlign: 'center', color: 'white' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{formatCurrency(value)}</div>
          <div>{drawer[value]} × {formatCurrency(value)} = {formatCurrency(drawer[value] * value)}</div>
          <div style={{ marginTop: '5px', display: 'flex', justifyContent: 'center', gap: '5px' }}>
            <button onClick={() => handleAdd(value)} style={{ padding: '5px 10px', background: 'green', color: 'white', border: 'none', borderRadius: '5px' }}>+</button>
            <button onClick={() => handleRemove(value)} style={{ padding: '5px 10px', background: 'red', color: 'white', border: 'none', borderRadius: '5px' }}>-</button>
          </div>
        </div>
      ))}
    </div>
  );

  if (!authenticated) {
    return (
      <div style={{ backgroundColor: '#121212', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Entrez le code pour accéder à la caisse</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: '10px', marginTop: '20px' }}>
          {[1,2,3,4,5,6,7,8,9,0].map(num => (
            <button key={num} onClick={() => setCodeInput(codeInput + num)} style={{ padding: '15px', fontSize: '18px' }}>{num}</button>
          ))}
        </div>
        <div style={{ marginTop: '20px' }}>
          <p>Code entré : {codeInput}</p>
          <button onClick={() => setCodeInput(codeInput.slice(0, -1))} style={{ marginRight: '10px' }}>Effacer</button>
          <button onClick={() => setAuthenticated(codeInput === "20072007")}>Valider</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto", color: 'white', backgroundColor: '#121212', minHeight: '100vh' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ flexGrow: 1, background: "#1e1e1e", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", color: "#00ff00" }}>{formatCurrency(balance + bank)}</h1>
          <p style={{ color: "#aaa" }}>Solde total (liquide + banque)</p>
          <p style={{ fontSize: "1rem", color: "#ccc" }}>Liquidité seule : {formatCurrency(balance)}</p>
        </div>

        <div style={{ width: "200px", background: "#1a1a1a", padding: "15px", borderRadius: "10px" }}>
          <h3 style={{ color: "#00d0ff", marginBottom: "10px" }}>Compte bancaire</h3>
          <p style={{ fontWeight: "bold", marginBottom: "10px" }}>{formatCurrency(bank)}</p>
          <input
            type="number"
            step="0.01"
            value={bankInput}
            onChange={(e) => setBankInput(e.target.value)}
            placeholder="Montant"
            style={{ width: "100%", padding: "6px", marginBottom: "10px", borderRadius: "5px" }}
          />
          <button onClick={() => handleBankUpdate(bankInput, "add")} style={{ width: "100%", marginBottom: "5px", background: "green", color: "white", padding: "6px", border: "none", borderRadius: "5px" }}>+ Ajouter</button>
          <button onClick={() => handleBankUpdate(bankInput, "remove")} style={{ width: "100%", background: "red", color: "white", padding: "6px", border: "none", borderRadius: "5px" }}>- Retirer</button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ color: 'white' }}>Quantité : </label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={{ width: '60px', marginLeft: '10px', marginRight: '20px' }}
        />
        <input
          type="text"
          placeholder="Détail de la transaction..."
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          style={{ width: '60%', padding: '5px' }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", flexWrap: "wrap", gap: "10px" }}>
        <button onClick={handleResetCaisse} style={{ padding: "10px 20px", background: "#444", color: "white", border: "none", borderRadius: "5px" }}>Réinitialiser la caisse</button>
        <button onClick={handleClearHistory} style={{ padding: "10px 20px", background: "#990000", color: "white", border: "none", borderRadius: "5px" }}>Réinitialiser l'historique</button>
        <button onClick={() => {
          const rows = history.map(h => `${h.date},${h.type},${h.amount || ""},${h.detail || ""}`).join("\n");
          const blob = new Blob(["Date,Type,Montant,Détail\n" + rows], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "historique_caisse.csv";
          a.click();
        }}
        style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "5px" }}>Exporter CSV</button>
      </div>

      <h2 style={{ marginTop: "30px", color: "white" }}>Billets</h2>
      {renderDrawer(billets)}

      <h2 style={{ marginTop: "30px", color: "white" }}>Pièces</h2>
      {renderDrawer(pieces)}

      <h3 style={{ color: 'white', marginTop: '30px' }}>Détail total par dénomination</h3>
      <ul style={{ color: 'white' }}>
        {denominations.map(d => (
          drawer[d] > 0 && (
            <li key={d}>
              {drawer[d]} x {formatCurrency(d)} = <strong>{formatCurrency(drawer[d] * d)}</strong>
            </li>
          )
        ))}
      </ul>

      <div style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '10px', color: 'white' }}>Historique</h2>
        <input
          type="text"
          placeholder="Filtrer l'historique..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '5px', marginBottom: '10px', width: '100%' }}
        />
        {filteredHistory.length === 0 && <p style={{ color: '#999' }}>Aucune transaction.</p>}
        {filteredHistory.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: item.type.includes('add') ? 'lightgreen' : item.type.includes('remove') ? 'salmon' : 'lightgray' }}>
            <span>{item.date}</span>
            <span>{item.type === 'add' ? '+' : item.type === 'remove' ? '-' : ''}{item.amount ? formatCurrency(item.amount) : ''} {item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
