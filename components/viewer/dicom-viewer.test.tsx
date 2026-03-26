import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DicomViewer } from './dicom-viewer';

const defaultImage = {
    id: '1',
    instanceNumber: 1,
    filename: 'test.dcm',
    seriesDescription: 'Mock',
    windowCenter: 40,
    windowWidth: 400,
    rescaleSlope: 1,
    rescaleIntercept: -1024,
    pixelData: new ImageData(2, 2),
};

describe('DicomViewer', () => {
    it('renders and toggles advanced modes', () => {
        render(<DicomViewer images={[defaultImage]} modality="CT" description="Test" />);
        expect(screen.getByText(/Zoom In/i)).toBeInTheDocument();

        const mprButton = screen.getByRole('button', { name: /MPR/i });
        const volumeButton = screen.getByRole('button', { name: /3D/i });
        const huButton = screen.getByRole('button', { name: /HU/i });

        fireEvent.click(mprButton);
        expect(mprButton).toHaveClass('border-border'); // look for accessible state is fine

        fireEvent.click(volumeButton);
        fireEvent.click(huButton);

        expect(screen.getByText(/Hounsfield Unit/i)).toBeInTheDocument();
    });
});
