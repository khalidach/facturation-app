import React from "react";

const StyleInput = ({ label, type, name, value, onChange, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
      {label}
    </label>
    <div className="relative mt-1">
      {type === "color" && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
          <div
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: value }}
          ></div>
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className={`block w-full text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 ${
          type === "color" ? "pl-8 py-1" : "px-2 py-1"
        }`}
        {...props}
      />
    </div>
  </div>
);

export default function StyleControls({ elementStyles = {}, onStyleChange }) {
  const handleChange = (e) => {
    onStyleChange(e.target.name, e.target.value);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <StyleInput
        label="Couleur du texte"
        type="color"
        name="color"
        value={elementStyles.color}
        onChange={handleChange}
      />
      <StyleInput
        label="Couleur de fond"
        type="color"
        name="backgroundColor"
        value={elementStyles.backgroundColor}
        onChange={handleChange}
      />

      <StyleInput
        label="Taille de police"
        type="text"
        name="fontSize"
        placeholder="ex: 14px"
        value={elementStyles.fontSize}
        onChange={handleChange}
      />
      <StyleInput
        label="Épaisseur (Weight)"
        type="text"
        name="fontWeight"
        placeholder="ex: bold, 500"
        value={elementStyles.fontWeight}
        onChange={handleChange}
      />

      <StyleInput
        label="Padding"
        type="text"
        name="padding"
        placeholder="ex: 8px"
        value={elementStyles.padding}
        onChange={handleChange}
      />
      <StyleInput
        label="Marge"
        type="text"
        name="margin"
        placeholder="ex: 8px 0"
        value={elementStyles.margin}
        onChange={handleChange}
      />

      <StyleInput
        label="Bordure"
        type="text"
        name="border"
        placeholder="ex: 1px solid #000"
        value={elementStyles.border}
        onChange={handleChange}
      />
      <StyleInput
        label="Rayon (Radius)"
        type="text"
        name="borderRadius"
        placeholder="ex: 4px"
        value={elementStyles.borderRadius}
        onChange={handleChange}
      />

      <StyleInput
        label="Largeur"
        type="text"
        name="width"
        placeholder="ex: 100px, 50%"
        value={elementStyles.width}
        onChange={handleChange}
      />
      <StyleInput
        label="Hauteur"
        type="text"
        name="height"
        placeholder="ex: 100px, auto"
        value={elementStyles.height}
        onChange={handleChange}
      />

      <StyleInput
        label="Opacité"
        type="number"
        name="opacity"
        min="0"
        max="1"
        step="0.1"
        value={elementStyles.opacity}
        onChange={handleChange}
      />
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
          Alignement texte
        </label>
        <select
          name="textAlign"
          value={elementStyles.textAlign || ""}
          onChange={handleChange}
          className="mt-1 block w-full text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 px-2 py-1"
        >
          <option value="">Par défaut</option>
          <option value="left">Gauche</option>
          <option value="center">Centre</option>
          <option value="right">Droite</option>
        </select>
      </div>
    </div>
  );
}
