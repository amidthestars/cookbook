import React from 'react';

function SimpleTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test</h1>
      <button onClick={() => alert('This button works!')}>
        Click Me
      </button>
      <button onClick={() => console.log('Console test')}>
        Console Test
      </button>
      <button onClick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  );
}

export default SimpleTest;