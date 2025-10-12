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
          {/* Left Side: Logo and Agency Name - Centered vertically */}
          <div className="flex items-center gap-4 flex-1">
            {settings?.logo && (
              <img
                src={settings.logo}
                alt="Agency Logo"
                className="h-20 w-auto block"
              />
            )}
            <h1 className="text-xl font-bold">
              {settings?.agencyName || "Your Agency"}
            </h1>
          </div>
          {/* Right Side: Invoice Details - Centered vertically, text aligned right */}
          <div className="flex flex-col items-end justify-center flex-1 text-right">
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
        <div className="mt-32">
          {facture?.clientName && (
            <div className="mt-8 border-t mb-6 border-b py-4">
              <p className="text-lg font-bold">{facture.clientName}</p>
              <p>{facture.clientAddress}</p>
              {facture.clientICE && (
                <p className="text-lg font-bold">ICE: {facture.clientICE}</p>
              )}
            </div>
          )}
          <table className="w-full text-xs border-collapse table-fixed">
            <thead className="bg-gray-100">
              <tr>
                <th
                  className="p-2 text-left font-semibold border"
                  style={{
                    width: showMargin
                      ? `${(5 / 15) * 100}%`
                      : `${(5 / 12) * 100}%`,
                  }}
                >
                  DESIGNATION
                </th>
                <th
                  className="p-2 text-center font-semibold border"
                  style={{
                    width: showMargin
                      ? `${(1 / 15) * 100}%`
                      : `${(1 / 12) * 100}%`,
                  }}
                >
                  QU
                </th>
                <th
                  className="p-2 text-right font-semibold border"
                  style={{
                    width: showMargin
                      ? `${(3 / 15) * 100}%`
                      : `${(3 / 12) * 100}%`,
                  }}
                >
                  PRIX UNITAIRE
                </th>
                {showMargin && (
                  <th
                    className="p-2 text-right font-semibold border"
                    style={{ width: `${(3 / 15) * 100}%` }}
                  >
                    FRAIS. SCE UNITAIRE
                  </th>
                )}
                <th
                  className="p-2 text-right font-semibold border"
                  style={{
                    width: showMargin
                      ? `${(3 / 15) * 100}%`
                      : `${(3 / 12) * 100}%`,
                  }}
                >
                  MONTANT TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {parsedItems.map((item, index) => (
                <tr key={index}>
                  <td
                    className="p-2 border break-words"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {item.description}
                  </td>
                  <td className="p-2 text-center border">{item.quantity}</td>
                  <td className="p-2 text-right border">
                    {(Number(item.prixUnitaire) || 0).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
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
      </div>
      <div className="border-t pt-5">
        <div className="flex gap-2 justify-center flex-wrap">
          {/* Contact info */}
          <div className="flex gap-2 flex-wrap justify-center w-full">
            {(() => {
              const numbers = [];
              if (settings?.agencyName && settings?.typeSociete)
                numbers.push(
                  `Sté. ${settings.agencyName} ${settings.typeSociete}`
                );
              if (settings?.capital)
                numbers.push(`Capital: ${settings.capital} Dhs`);
              if (settings?.address)
                numbers.push(`Siège Sociol: ${settings.address}`);
              if (settings?.phone) numbers.push(`Fix: ${settings.phone}`);
              if (settings?.email) numbers.push(`Email: ${settings.email}`);
              if (settings?.ice) numbers.push(`ICE: ${settings.ice}`);
              if (settings?.if) numbers.push(`IF: ${settings.if}`);
              if (settings?.rc) numbers.push(`RC: ${settings.rc}`);
              if (settings?.patente)
                numbers.push(`Patente: ${settings.patente}`);
              if (settings?.cnss) numbers.push(`CNSS: ${settings.cnss}`);
              if (settings?.bankName && settings?.rib)
                numbers.push(`Bank ${settings.bankName}: ${settings.rib}`);

              return numbers.map((item, idx) => (
                <p key={idx} className="text-xs">
                  {idx > 0 ? `- ${item}` : item}
                </p>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
