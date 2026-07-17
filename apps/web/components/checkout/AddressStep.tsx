"use client";
import { useState } from "react";
import { Plus, MapPin, Home, Briefcase, Edit2, Trash2, Check } from "lucide-react";
import { useAddressStore, type Address } from "@/lib/stores/address.store";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand",
  "West Bengal","Delhi","Jammu and Kashmir","Ladakh",
];

interface Props {
  selected: Address | null;
  onNext:   (addr: Address) => void;
}

const BLANK_FORM = {
  label: "Home", fullName: "", phone: "", line1: "", line2: "",
  city: "", state: "Maharashtra", pincode: "", isDefault: false,
};

export default function AddressStep({ selected, onNext }: Props) {
  const { addresses, addAddress, updateAddress, deleteAddress, selectAddress } = useAddressStore();
  const [chosenId,  setChosenId]  = useState<string | null>(selected?.id ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null);
  const [showForm,  setShowForm]  = useState(addresses.length === 0);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState(BLANK_FORM);
  const [errors,    setErrors]    = useState<Partial<typeof BLANK_FORM>>({});

  const validate = () => {
    const e: Partial<typeof BLANK_FORM> = {};
    if (!form.fullName.trim())              e.fullName  = "Required";
    if (!/^\d{10}$/.test(form.phone))       e.phone     = "10-digit mobile number";
    if (!form.line1.trim())                 e.line1     = "Required";
    if (!form.city.trim())                  e.city      = "Required";
    if (!/^\d{6}$/.test(form.pincode))      e.pincode   = "6-digit PIN code";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editId) {
      updateAddress(editId, form);
      setChosenId(editId);
    } else {
      const id = addAddress(form);
      setChosenId(id);
    }
    setShowForm(false);
    setEditId(null);
    setForm(BLANK_FORM);
  };

  const openEdit = (addr: Address) => {
    setEditId(addr.id);
    setForm({ label: addr.label, fullName: addr.fullName, phone: addr.phone,
      line1: addr.line1, line2: addr.line2 ?? "", city: addr.city,
      state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault });
    setShowForm(true);
  };

  const handleContinue = () => {
    const addr = addresses.find((a) => a.id === chosenId);
    if (!addr) return;
    selectAddress(addr.id);
    onNext(addr);
  };

  const labelIcon = (l: string) =>
    l === "Home" ? <Home className="h-3.5 w-3.5" /> :
    l === "Work" ? <Briefcase className="h-3.5 w-3.5" /> :
    <MapPin className="h-3.5 w-3.5" />;

  const field = (
    key: keyof typeof BLANK_FORM,
    label: string,
    placeholder = "",
    type = "text",
    as?: "select",
  ) => (
    <div>
      <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">{label}</label>
      {as === "select" ? (
        <select
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm font-body bg-white focus:outline-none focus:border-[var(--rose)]"
        >
          {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 rounded-lg border text-sm font-body bg-white focus:outline-none focus:border-[var(--rose)] ${
            errors[key] ? "border-red-400" : "border-[var(--border)]"
          }`}
        />
      )}
      {errors[key] && <p className="text-xs text-red-500 mt-0.5 font-body">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Address list */}
      <div className="md:col-span-3 space-y-3">
        <h2 className="font-display text-xl font-medium text-[var(--charcoal)] mb-4">Delivery Address</h2>

        {addresses.map((addr) => (
          <div
            key={addr.id}
            onClick={() => setChosenId(addr.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              chosenId === addr.id
                ? "border-[var(--rose)] bg-[var(--rose)]/5 shadow-sm"
                : "border-[var(--border)] bg-white hover:border-[var(--rose)]/40"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Radio */}
              <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                chosenId === addr.id ? "border-[var(--rose)]" : "border-[var(--border)]"
              }`}>
                {chosenId === addr.id && <div className="h-2.5 w-2.5 rounded-full bg-[var(--rose)]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs font-body font-semibold px-2 py-0.5 rounded-full ${
                    chosenId === addr.id ? "bg-[var(--rose)] text-white" : "bg-[var(--cream-dark)] text-[var(--charcoal-mid)]"
                  }`}>
                    {labelIcon(addr.label)} {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-body font-semibold text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded-full border border-emerald-200">Default</span>
                  )}
                </div>
                <p className="text-sm font-body font-semibold text-[var(--charcoal)]">{addr.fullName}</p>
                <p className="text-xs font-body text-[var(--charcoal-mid)] leading-relaxed">
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""},{" "}
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
                <p className="text-xs font-body text-[var(--muted)] mt-0.5">📞 {addr.phone}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); openEdit(addr); }}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--cream-dark)] transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); if (chosenId === addr.id) setChosenId(null); }}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add new button */}
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(BLANK_FORM); }}
            className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-sm font-body text-[var(--muted)] hover:border-[var(--rose)] hover:text-[var(--rose)] transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add New Address
          </button>
        )}

        {/* Continue */}
        {!showForm && chosenId && (
          <button
            onClick={handleContinue}
            className="w-full py-3.5 rounded-xl bg-[var(--charcoal)] text-white text-sm font-body font-semibold hover:bg-[var(--rose)] transition-colors mt-2"
          >
            Continue to Review →
          </button>
        )}
      </div>

      {/* Address form */}
      {showForm && (
        <div className="md:col-span-2 bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm h-fit">
          <h3 className="font-display text-lg font-medium text-[var(--charcoal)] mb-4">
            {editId ? "Edit Address" : "New Address"}
          </h3>
          <div className="space-y-3">
            {/* Label selector */}
            <div>
              <label className="block text-xs font-body font-medium text-[var(--charcoal)] mb-1">Address Label</label>
              <div className="flex gap-2">
                {["Home", "Work", "Other"].map((l) => (
                  <button
                    key={l}
                    onClick={() => setForm((f) => ({ ...f, label: l }))}
                    className={`flex-1 py-2 rounded-lg border text-xs font-body font-medium transition-colors ${
                      form.label === l ? "border-[var(--rose)] bg-[var(--rose)]/5 text-[var(--rose)]" : "border-[var(--border)] text-[var(--charcoal-mid)]"
                    }`}
                  >{l}</button>
                ))}
              </div>
            </div>
            {field("fullName", "Full Name", "Priya Sharma")}
            {field("phone", "Mobile Number", "9876543210", "tel")}
            {field("line1", "Address Line 1", "Flat 4B, Sunshine Apartments")}
            {field("line2", "Address Line 2 (optional)", "Near City Mall")}
            <div className="grid grid-cols-2 gap-3">
              {field("city", "City", "Mumbai")}
              {field("pincode", "PIN Code", "400001", "text")}
            </div>
            {field("state", "State", "", "text", "select")}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="rounded border-[var(--border)] accent-[var(--rose)]" />
              <span className="text-xs font-body text-[var(--charcoal-mid)]">Set as default address</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(BLANK_FORM); setErrors({}); }}
                className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-sm font-body text-[var(--charcoal-mid)] hover:bg-[var(--cream-dark)] transition-colors">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-lg bg-[var(--charcoal)] text-white text-sm font-body font-medium hover:bg-[var(--rose)] transition-colors flex items-center justify-center gap-1.5">
                <Check className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
