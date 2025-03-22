import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const BarcodeScanner = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const onUpdateOfBarcode = (err, result) => {
    console.log(result);
    if (result) {
      setData(result.text);

      const url = `/item/${result.text}`;
      navigate(url);
    }
  };

  return (
    <div>
      <h2>Barcode Scanner</h2>
      <BarcodeScannerComponent
        width={500}
        height={500}
        onUpdate={onUpdateOfBarcode}
      />
      <p>Scanned Result: {data}</p>
    </div>
  );
};

export default BarcodeScanner;
