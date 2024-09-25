document.addEventListener('DOMContentLoaded', () => {

    const socket = io();

    socket.on('connect', () => {
        console.log('user connected :- ', socket.id);

        socket.emit('userConnect', socket.id);

        socket.on('sendScreenShot', async () => {
            try {
                setTimeout(async () => {

                    const captureCanvas = await html2canvas(document.body, {
                        scrollX: window.scrollX,
                        scrollY: 0,
                        x: window.scrollX,
                        y: window.scrollY,
                        width: window.innerWidth,
                        height: window.innerHeight,
                        useCORS: true,
                        scale: window.devicePixelRatio
                    });

                    console.log('Canvas created successfully:', captureCanvas);

                    const blob = await new Promise((resolve, reject) => {
                        captureCanvas.toBlob((blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Failed to create Blob from canvas'));
                            }
                        }, 'image/png');
                    });

                    console.log('Blob created successfully:', blob);

                    const arrayBuffer = await blob.arrayBuffer();
                    console.log('ArrayBuffer created successfully:', arrayBuffer);

                    const chunkSize = 25 * 1024;
                    const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

                    console.log(totalChunks, '--totalChunks--');

                    for (let i = 0; i < totalChunks; i++) {
                        const start = i * chunkSize;
                        const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
                        const chunk = arrayBuffer.slice(start, end);
                        console.log(chunk, '--chunk--');

                        socket.emit('sendSSDataInChuk', {
                            chunk,
                            index: i,
                            totalChunks: totalChunks
                        });
                    };
                }, 500);
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });
});