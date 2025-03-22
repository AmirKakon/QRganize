import React, { useState } from 'react';
import BarcodeScannerComponent  from 'react-qr-barcode-scanner';

const BarcodeScanner = () => {
  const [data, setData] = useState('No result');

  return (
    <div>
      <h2>Barcode Scanner</h2>
      <BarcodeScannerComponent
        width={500}
        height={500}
        onUpdate={(err, result) => {
          if (result) setData(result.text);
          else setData("Not Found");
          console.log(result);
        }}
      />
      <p>Scanned Result: {data}</p>
    </div>
  );
}

export default BarcodeScanner;