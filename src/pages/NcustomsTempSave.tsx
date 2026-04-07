import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Layout from "../component/layout/Layout";
import TableLayout from "../component/layout/TableLayout";
import SearchInput from "../component/inputs/SearchInput";
import { api } from "../lib/api/client";
import { getErrorMessage } from "../lib/error/getErrorMessage";
import type {
  MyPageData,
  NcustomsShipper,
  NcustomsTempSaveRequest,
  NcustomsTempSaveResponse,
} from "../lib/api/types";

type ShipperTarget = "suchulja" | "whaju" | "trust";

type TempSaveForm = {
  year: string;
  userCode: string;
  segwan: string;
  gwa: string;
  suchuljaCode: string;
  suchuljaSangho: string;
  trustCode: string;
  trustSangho: string;
  trustTong: string;
  trustSaup: string;
  whajuCode: string;
  whajuSangho: string;
  whajuTong: string;
  whajuSaup: string;
  gumaejaCode: string;
  ivNo: string;
  containerNo: string;
  hsCode: string;
  qty: string;
  totalWeight: string;
  packageCount: string;
  gyeljeMoney: string;
  usdExch: string;
  gyeljeInput: string;
  indojo: string;
  weightUnit: string;
  packageUnit: string;
};

function seoulYear(): string {
  const now = new Date();
  const seoulNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return String(seoulNow.getFullYear());
}

function toNumberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function NcustomsTempSave() {
  const [form, setForm] = useState<TempSaveForm>({
    year: seoulYear(),
    userCode: "4",
    segwan: "020",
    gwa: "09",
    suchuljaCode: "",
    suchuljaSangho: "",
    trustCode: "",
    trustSangho: "",
    trustTong: "",
    trustSaup: "",
    whajuCode: "",
    whajuSangho: "",
    whajuTong: "",
    whajuSaup: "",
    gumaejaCode: "",
    ivNo: "",
    containerNo: "",
    hsCode: "",
    qty: "1",
    totalWeight: "1660",
    packageCount: "1",
    gyeljeMoney: "USD",
    usdExch: "1439.26",
    gyeljeInput: "14200",
    indojo: "FOB",
    weightUnit: "KG",
    packageUnit: "OU",
  });

  const [shipperTarget, setShipperTarget] = useState<ShipperTarget>("suchulja");
  const [shipperCodePrefix, setShipperCodePrefix] = useState("00");
  const [shipperKeyword, setShipperKeyword] = useState("");
  const [shipperRows, setShipperRows] = useState<NcustomsShipper[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<NcustomsTempSaveResponse | null>(null);

  useEffect(() => {
    api.get("/api/users/me")
      .then((data: unknown) => {
        const me = data as MyPageData;
        if (me.ncustomsUserCode && me.ncustomsUserCode.trim()) {
          setForm((prev) => ({ ...prev, userCode: me.ncustomsUserCode!.trim() }));
        }
      })
      .catch(() => {
        // ignore and keep default userCode
      });
  }, []);

  const requiredMissing = useMemo(() => {
    const required: Array<keyof TempSaveForm> = [
      "year",
      "userCode",
      "segwan",
      "gwa",
      "suchuljaCode",
      "trustCode",
      "ivNo",
      "containerNo",
      "hsCode",
    ];
    return required.filter((key) => !form[key].trim());
  }, [form]);

  const setField = (key: keyof TempSaveForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadShippers = async () => {
    setSearching(true);
    setMessage("");
    try {
      const data = (await api.get<NcustomsShipper[]>("/api/ncustoms/shippers", {
        params: {
          codePrefix: shipperCodePrefix || "00",
          keyword: shipperKeyword || undefined,
          limit: 100,
        },
      })) as unknown as NcustomsShipper[];
      setShipperRows(data);
      if (data.length === 0) {
        setMessage("No shipper rows found.");
      }
    } catch (error) {
      setMessage(getErrorMessage(error, "Failed to load shipper codes."));
    } finally {
      setSearching(false);
    }
  };

  const applyShipper = (row: NcustomsShipper) => {
    if (shipperTarget === "suchulja") {
      setForm((prev) => ({
        ...prev,
        suchuljaCode: row.dealCode ?? "",
        suchuljaSangho: row.dealSangho ?? "",
      }));
      return;
    }

    if (shipperTarget === "whaju") {
      setForm((prev) => ({
        ...prev,
        whajuCode: row.dealCode ?? "",
        whajuSangho: row.dealSangho ?? "",
        whajuTong: row.dealTong ?? "",
        whajuSaup: row.dealSaup ?? "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      trustCode: row.dealCode ?? "",
      trustSangho: row.dealSangho ?? "",
      trustTong: row.dealTong ?? "",
      trustSaup: row.dealSaup ?? "",
    }));
  };

  const buildPayload = (): NcustomsTempSaveRequest => {
    const payload: NcustomsTempSaveRequest = {
      year: form.year.trim(),
      userCode: form.userCode.trim(),
      segwan: form.segwan.trim(),
      gwa: form.gwa.trim(),
      suchuljaCode: form.suchuljaCode.trim(),
      suchuljaSangho: form.suchuljaSangho.trim() || undefined,
      trustCode: form.trustCode.trim(),
      trustSangho: form.trustSangho.trim() || undefined,
      trustTong: form.trustTong.trim() || undefined,
      trustSaup: form.trustSaup.trim() || undefined,
      whajuCode: form.whajuCode.trim() || undefined,
      whajuSangho: form.whajuSangho.trim() || undefined,
      whajuTong: form.whajuTong.trim() || undefined,
      whajuSaup: form.whajuSaup.trim() || undefined,
      gumaejaCode: form.gumaejaCode.trim() || undefined,
      ivNo: form.ivNo.trim(),
      containerNo: form.containerNo.trim(),
      hsCode: form.hsCode.trim(),
      gyeljeMoney: form.gyeljeMoney.trim() || undefined,
      indojo: form.indojo.trim() || undefined,
      weightUnit: form.weightUnit.trim() || undefined,
      packageUnit: form.packageUnit.trim() || undefined,
    };

    const qty = toNumberOrUndefined(form.qty);
    const totalWeight = toNumberOrUndefined(form.totalWeight);
    const packageCount = toNumberOrUndefined(form.packageCount);
    const usdExch = toNumberOrUndefined(form.usdExch);
    const gyeljeInput = toNumberOrUndefined(form.gyeljeInput);

    if (qty !== undefined) payload.qty = qty;
    if (totalWeight !== undefined) payload.totalWeight = totalWeight;
    if (packageCount !== undefined) payload.packageCount = packageCount;
    if (usdExch !== undefined) payload.usdExch = usdExch;
    if (gyeljeInput !== undefined) payload.gyeljeInput = gyeljeInput;

    return payload;
  };

  const submitTempSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setResult(null);

    if (requiredMissing.length > 0) {
      setMessage(`Missing required fields: ${requiredMissing.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const response = (await api.post<NcustomsTempSaveResponse>(
        "/api/ncustoms/exports/temp-with-container",
        buildPayload(),
      )) as unknown as NcustomsTempSaveResponse;
      setResult(response);
      setMessage("Temporary save completed.");
    } catch (error) {
      setMessage(getErrorMessage(error, "Temporary save failed."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout activeMenu={5}>
      <div className="pt-9 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold text-Neutral-900">NCustoms Temp Save</h1>
          <div className="text-sm text-Neutral-600">
            Uses: /api/ncustoms/shippers, /api/ncustoms/exports/temp-with-container
          </div>
        </div>

        <TableLayout>
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-bold text-Neutral-900">Code Lookup (DDeal)</h2>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-Neutral-600">Target</label>
                <select
                  value={shipperTarget}
                  onChange={(e) => setShipperTarget(e.target.value as ShipperTarget)}
                  className="h-10 rounded-md border border-Neutral-400 px-3"
                >
                  <option value="suchulja">Suchulja</option>
                  <option value="whaju">Whaju</option>
                  <option value="trust">Trust</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-Neutral-600">Code Prefix</label>
                <input
                  value={shipperCodePrefix}
                  onChange={(e) => setShipperCodePrefix(e.target.value)}
                  className="h-10 rounded-md border border-Neutral-400 px-3"
                  placeholder="00"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-sm text-Neutral-600">Keyword</label>
                <SearchInput
                  placeholder="deal_sangho / deal_name"
                  value={shipperKeyword}
                  onChange={setShipperKeyword}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={loadShippers}
                disabled={searching}
                className="px-4 py-2 rounded-md bg-Brand-2 text-white text-sm font-medium disabled:opacity-60"
              >
                {searching ? "Searching..." : "Search Codes"}
              </button>
            </div>
            <div className="max-h-52 overflow-auto rounded-md border border-Neutral-300">
              <table className="w-full text-sm">
                <thead className="bg-Neutral-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Sangho</th>
                    <th className="px-3 py-2 text-left">Tong</th>
                    <th className="px-3 py-2 text-left">Saup</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shipperRows.map((row) => (
                    <tr key={row.dealCode} className="border-t border-Neutral-200">
                      <td className="px-3 py-2">{row.dealCode}</td>
                      <td className="px-3 py-2">{row.dealSangho}</td>
                      <td className="px-3 py-2">{row.dealTong}</td>
                      <td className="px-3 py-2">{row.dealSaup}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => applyShipper(row)}
                          className="px-2 py-1 rounded bg-Blue-50 text-Blue-700 text-xs font-medium"
                        >
                          Apply
                        </button>
                      </td>
                    </tr>
                  ))}
                  {shipperRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-Neutral-600">
                        Search and select a code.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TableLayout>

        <TableLayout>
          <form className="flex flex-col gap-4" onSubmit={submitTempSave}>
            <h2 className="text-[18px] font-bold text-Neutral-900">Temp Save Form</h2>

            <div className="grid grid-cols-4 gap-3">
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="year" value={form.year} onChange={(e) => setField("year", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="userCode" value={form.userCode} onChange={(e) => setField("userCode", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="segwan" value={form.segwan} onChange={(e) => setField("segwan", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="gwa" value={form.gwa} onChange={(e) => setField("gwa", e.target.value)} />

              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="suchuljaCode" value={form.suchuljaCode} onChange={(e) => setField("suchuljaCode", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="suchuljaSangho" value={form.suchuljaSangho} onChange={(e) => setField("suchuljaSangho", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="trustCode" value={form.trustCode} onChange={(e) => setField("trustCode", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="trustSangho" value={form.trustSangho} onChange={(e) => setField("trustSangho", e.target.value)} />

              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="whajuCode" value={form.whajuCode} onChange={(e) => setField("whajuCode", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="whajuSangho" value={form.whajuSangho} onChange={(e) => setField("whajuSangho", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="gumaejaCode" value={form.gumaejaCode} onChange={(e) => setField("gumaejaCode", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="ivNo" value={form.ivNo} onChange={(e) => setField("ivNo", e.target.value)} />

              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="containerNo" value={form.containerNo} onChange={(e) => setField("containerNo", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="hsCode" value={form.hsCode} onChange={(e) => setField("hsCode", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="qty" value={form.qty} onChange={(e) => setField("qty", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="totalWeight" value={form.totalWeight} onChange={(e) => setField("totalWeight", e.target.value)} />

              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="packageCount" value={form.packageCount} onChange={(e) => setField("packageCount", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="gyeljeMoney" value={form.gyeljeMoney} onChange={(e) => setField("gyeljeMoney", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="usdExch" value={form.usdExch} onChange={(e) => setField("usdExch", e.target.value)} />
              <input className="h-10 rounded-md border border-Neutral-400 px-3" placeholder="gyeljeInput" value={form.gyeljeInput} onChange={(e) => setField("gyeljeInput", e.target.value)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-Neutral-600">
                Required: year, userCode, segwan, gwa, suchuljaCode, trustCode, ivNo, containerNo, hsCode
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-md bg-Brand-2 text-white text-sm font-medium disabled:opacity-60"
              >
                {saving ? "Saving..." : "Temp Save"}
              </button>
            </div>
          </form>
        </TableLayout>

        {message && (
          <div className="rounded-md border border-Neutral-300 bg-white px-4 py-3 text-sm text-Neutral-700">
            {message}
          </div>
        )}

        {result && (
          <div className="rounded-md border border-Green-200 bg-Green-50 px-4 py-3 text-sm text-Green-700">
            Saved: expoKey={result.expoKey}, jechlNo={result.expoJechlNo}, containerNo={result.containerNo}
          </div>
        )}
      </div>
    </Layout>
  );
}
