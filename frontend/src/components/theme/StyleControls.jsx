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
        label="Text Color"
        type="color"
        name="color"
        value={elementStyles.color}
        onChange={handleChange}
      />
      <StyleInput
        label="Background Color"
        type="color"
        name="backgroundColor"
        value={elementStyles.backgroundColor}
        onChange={handleChange}
      />

      <StyleInput
        label="Font Size"
        type="text"
        name="fontSize"
        placeholder="e.g., 14px"
        value={elementStyles.fontSize}
        onChange={handleChange}
      />
      <StyleInput
        label="Font Weight"
        type="text"
        name="fontWeight"
        placeholder="e.g., bold, 500"
        value={elementStyles.fontWeight}
        onChange={handleChange}
      />

      <StyleInput
        label="Padding"
        type="text"
        name="padding"
        placeholder="e.g., 8px"
        value={elementStyles.padding}
        onChange={handleChange}
      />
      <StyleInput
        label="Margin"
        type="text"
        name="margin"
        placeholder="e.g., 8px 0"
        value={elementStyles.margin}
        onChange={handleChange}
      />

      <StyleInput
        label="Border"
        type="text"
        name="border"
        placeholder="e.g., 1px solid #000"
        value={elementStyles.border}
        onChange={handleChange}
      />
      <StyleInput
        label="Border Radius"
        type="text"
        name="borderRadius"
        placeholder="e.g., 4px"
        value={elementStyles.borderRadius}
        onChange={handleChange}
      />

      <StyleInput
        label="Width"
        type="text"
        name="width"
        placeholder="e.g., 100px, 50%"
        value={elementStyles.width}
        onChange={handleChange}
      />
      <StyleInput
        label="Height"
        type="text"
        name="height"
        placeholder="e.g., 100px, auto"
        value={elementStyles.height}
        onChange={handleChange}
      />

      <StyleInput
        label="Opacity"
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
          Text Align
        </label>
        <select
          name="textAlign"
          value={elementStyles.textAlign || ""}
          onChange={handleChange}
          className="mt-1 block w-full text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 px-2 py-1"
        >
          <option value="">Default</option>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}
