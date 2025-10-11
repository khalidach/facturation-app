import React from "react";
import { useQuery } from "@tanstack/react-query";
import { numberToWordsFr } from "@/services/numberToWords.js";

const api = {
  getSettings: () =>
    fetch("http://localhost:3001/api/settings").then((res) => res.json()),
};

export default function FacturePDF({ facture }) {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
  });

  const totalInWords = numberToWordsFr(facture.total);
  const showMargin = facture.showMargin ?? true;
  const parsedItems =
    typeof facture.items === "string"
      ? JSON.parse(facture.items)
      : facture.items;

  return (
    <div
      className="bg-white p-10 font-sans text-xs flex flex-col"
      style={{ width: "210mm", minHeight: "297mm" }}
    >
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-8">
          {/* Left Side: Logo and Agency Name */}
          <div className="flex items-center gap-4">
            {settings?.logo && (
              <img
                src={settings.logo}
                alt="Agency Logo"
                className="h-20 w-auto"
              />
            )}
            <h1 className="text-xl font-bold">
              {settings?.agencyName || "Your Agency"}
            </h1>
          </div>

          {/* Right Side: Invoice Details */}
          <div className="text-right">
            <h2 className="text-3xl font-bold uppercase text-gray-700">
              {facture.type}
            </h2>
            <p className="text-sm mt-1">N°: {facture.facture_number}</p>
            <p className="text-sm">
              Date: {new Date(facture.date).toLocaleDateString()}
            </p>
            {settings?.ice && <p className="text-sm">ICE: {settings.ice}</p>}
          </div>
        </div>
        {facture?.clientName && (
          <div className="mt-8 border-t border-b py-4">
            <p>{facture.clientName}</p>
            <p>{facture.clientAddress}</p>
            {facture.clientICE && <p>ICE: {facture.clientICE}</p>}
          </div>
        )}
        <table className="w-full mt-10 text-xs border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left font-semibold border">
                DESIGNATION
              </th>
              <th className="p-2 text-center font-semibold border">QU</th>
              <th className="p-2 text-right font-semibold border">
                PRIX UNITAIRE
              </th>
              {showMargin && (
                <th className="p-2 text-right font-semibold border">
                  FRAIS. SCE UNITAIRE
                </th>
              )}
              <th className="p-2 text-right font-semibold border">
                MONTANT TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {parsedItems.map((item, index) => (
              <tr key={index}>
                <td className="p-2 border">{item.description}</td>
                <td className="p-2 text-center border">{item.quantity}</td>
                <td className="p-2 text-right border">
                  {(Number(item.prixUnitaire) || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                {showMargin && (
                  <td className="p-2 text-right border">
                    {(Number(item.fraisServiceUnitaire) || 0).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </td>
                )}
                <td className="p-2 text-right border font-semibold">
                  {(Number(item.total) || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-5">
          <div className="w-1/2 space-y-1 text-xs">
            {showMargin && (
              <>
                <div className="flex justify-between p-2">
                  <span className="font-medium text-gray-600">
                    Prix Total H. Frais de SCE
                  </span>
                  <span className="font-semibold text-gray-800">
                    {Number(facture.prixTotalHorsFrais).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}{" "}
                    MAD
                  </span>
                </div>
                <div className="flex justify-between p-2">
                  <span className="font-medium text-gray-600">
                    Frais de Service Hors TVA
                  </span>
                  <span className="font-semibold text-gray-800">
                    {Number(facture.totalFraisServiceHT).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}{" "}
                    MAD
                  </span>
                </div>
                <div className="flex justify-between p-2">
                  <span className="font-medium text-gray-600">TVA 20%</span>
                  <span className="font-semibold text-gray-800">
                    {Number(facture.tva).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    MAD
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-sm bg-gray-100 p-2 rounded mt-1">
              <span>
                Total {facture.type === "devis" ? "Devis" : "Facture"}
              </span>
              <span>
                {Number(facture.total).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                MAD
              </span>
            </div>
          </div>
        </div>
        <div className="mt-8 text-xs">
          <p>Arrêté la présente facture à la somme de :</p>
          <p className="font-bold capitalize">{totalInWords}</p>
        </div>
      </div>
      <div className="border-t pt-5">
        <div className="flex gap-2 justify-center flex-wrap">
          <div className="flex gap-2 flex-wrap justify-center w-full">
            {settings?.address && (
              <p className="text-lg">Address: {settings.address} </p>
            )}
            {settings?.phone && (
              <p className="text-lg"> Tel: {settings.phone} </p>
            )}
            {settings?.email && (
              <p className="text-lg"> Email: {settings.email}</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-center w-full">
            {settings?.ice && <p className="text-sm">ICE: {settings.ice}</p>}
            {settings?.if && <p className="text-sm">/ IF: {settings.if}</p>}
            {settings?.rc && <p className="text-sm">/ RC: {settings.rc}</p>}
            {settings?.patente && (
              <p className="text-sm">/ Patente: {settings.patente}</p>
            )}
            {settings?.cnss && (
              <p className="text-sm">/ CNSS: {settings.cnss}</p>
            )}
          </div>
          {settings?.bankName && (
            <div className="flex gap-2 flex-wrap justify-center w-full">
              <p className="text-sm">Bank: {settings.bankName}</p>
              <p className="text-sm">RIB: {settings.rib}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
