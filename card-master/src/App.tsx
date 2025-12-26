import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

interface Card {
  id: number
  bank_name: string
  limit_amount: number
  current_debt: number
  cutoff_date: string
}

function App() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    bank_name: '',
    limit_amount: '',
    current_debt: '',
    cutoff_date: ''
  })

  useEffect(() => {
    fetchCards()
  }, [])

  async function fetchCards() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setCards(data)
    } catch (error: any) {
      // Okuma hatası olursa göster
      alert('VERİ ÇEKME HATASI: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function addCard(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.bank_name || !formData.limit_amount) return

    try {
      // Veriyi eklemeyi dene
      const { error } = await supabase
        .from('cards')
        .insert([
          {
            bank_name: formData.bank_name,
            limit_amount: parseFloat(formData.limit_amount),
            current_debt: parseFloat(formData.current_debt),
            cutoff_date: formData.cutoff_date
          }
        ])

      // EĞER HATA VARSA: Ekrana yazdır!
      if (error) {
        alert("KAYIT HATASI (Bunu Kopyala): " + error.message + "\nDetay: " + error.details)
        console.error("Supabase Hatası:", error)
      } else {
        alert("✅ BAŞARILI! Kart veritabanına yazıldı.")
        setFormData({ bank_name: '', limit_amount: '', current_debt: '', cutoff_date: '' })
        fetchCards()
      }

    } catch (error: any) {
      alert('BİLİNMEYEN HATA: ' + error.message)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="container">
      <h1>💳 Kredi Kartı Takipçim</h1>
      
      <div className="card-form">
        <h2>Yeni Kart Ekle</h2>
        <form onSubmit={addCard}>
          <input type="text" name="bank_name" placeholder="Banka Adı (Örn: Garanti)" value={formData.bank_name} onChange={handleChange} required />
          <input type="number" name="limit_amount" placeholder="Kart Limiti" value={formData.limit_amount} onChange={handleChange} required />
          <input type="number" name="current_debt" placeholder="Güncel Borç" value={formData.current_debt} onChange={handleChange} required />
          <input type="text" name="cutoff_date" placeholder="Hesap Kesim" value={formData.cutoff_date} onChange={handleChange} required />
          <button type="submit">Kartı Kaydet</button>
        </form>
      </div>

      <div className="card-list">
        <h2>Kartlarım</h2>
        {loading ? <p>Yükleniyor...</p> : cards.length === 0 ? <p>Kayıtlı kart yok.</p> : (
          <div className="grid">
            {cards.map((card) => (
              <div key={card.id} className="card-item">
                <h3>{card.bank_name}</h3>
                <div className="card-details">
                  <p>Limit: <strong>{card.limit_amount} TL</strong></p>
                  <p>Borç: <strong style={{color: '#ff4444'}}>{card.current_debt} TL</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App