import React from 'react';
import { render, screen } from '@testing-library/react';
import { MultiPlanarReconstruction } from './advanced-visualization';

const createStack = (length = 3, width = 4, height = 4) => {
    const stack = [];
    for (let i = 0; i < length; i++) {
        const data = new ImageData(width, height);
        stack.push(data);
    }
    return stack;
};

describe('MultiPlanarReconstruction', () => {
    it('renders MPR controls', () => {
        render(<MultiPlanarReconstruction imageStack={createStack()} />);
        expect(screen.getByText(/Multi-Planar Reconstruction/i)).toBeInTheDocument();
        expect(screen.getByText(/Axial/i)).toBeInTheDocument();
    });
});
