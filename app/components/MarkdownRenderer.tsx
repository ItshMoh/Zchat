'use client';
import React from 'react';
import { parseMarkdown, ParsedElement } from '@/app/utils/markdown-parser';
import PriceChart from './PriceChart';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';

interface MarkdownRendererProps {
    content: string;
    priceData?: {
        token: string;
        currency: string;
        dataPoints: { date: string; price: number }[];
    };
    hotelData?: any[];
}

/**
 * Component to render parsed markdown content
 * Supports: New lines, Bold text, Code blocks, Interactive price charts, and Hotel cards with images
 */
export default function MarkdownRenderer({ content, priceData, hotelData }: MarkdownRendererProps) {
    const elements = parseMarkdown(content);

    return (
        <div className="space-y-3">
            <div className="whitespace-pre-wrap">
                {elements.map((element: ParsedElement, index: number) => {
                    switch (element.type) {
                        case 'newline':
                            return <br key={index} />;

                        case 'bold':
                            return (
                                <strong key={index} className="font-semibold text-zinc-100">
                                    {element.content}
                                </strong>
                            );

                        case 'code':
                            return (
                                <code
                                    key={index}
                                    className="bg-zinc-800 px-1.5 py-0.5 rounded text-blue-300 font-mono text-sm"
                                >
                                    {element.content}
                                </code>
                            );

                        case 'text':
                        default:
                            return <span key={index}>{element.content}</span>;
                    }
                })}
            </div>

            {/* Display interactive Plotly chart if price data available */}
            {priceData && (
                <PriceChart
                    dataPoints={priceData.dataPoints}
                    tokenId={priceData.token}
                    currency={priceData.currency}
                />
            )}

            {/* Display hotel cards if hotel data available */}
            {hotelData && hotelData.length > 0 && (
                <div className="mt-4 space-y-4">
                    {hotelData.map((hotel: any, index: number) => (
                        <div
                            key={hotel.id || index}
                            className="rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-900/50 hover:border-zinc-600/50 transition-all"
                        >
                            {/* Hotel Image */}
                            {hotel.hotelImage && (
                                <div className="relative w-full h-48 bg-zinc-800">
                                    <Image
                                        src={hotel.hotelImage}
                                        alt={hotel.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 600px"
                                    />
                                </div>
                            )}

                            {/* Hotel Details */}
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-zinc-100">{hotel.name}</h3>
                                    {hotel.rating && (
                                        <div className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-full flex-shrink-0">
                                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-sm font-medium text-zinc-100">{hotel.rating}</span>
                                        </div>
                                    )}
                                </div>

                                {hotel.location && (
                                    <div className="flex items-center gap-1.5 text-zinc-400 text-sm mb-3">
                                        <MapPin className="w-4 h-4" />
                                        <span>{hotel.location}</span>
                                    </div>
                                )}

                                {hotel.description && (
                                    <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                                        {hotel.description}
                                    </p>
                                )}

                                {/* Room Types */}
                                {hotel.rooms && hotel.rooms.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-zinc-400">Available Rooms:</h4>
                                        <div className="space-y-2">
                                            {hotel.rooms.slice(0, 3).map((room: any) => (
                                                <div
                                                    key={room.id}
                                                    className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3"
                                                >
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-zinc-200">{room.type}</div>
                                                        <div className="text-xs text-zinc-500">Capacity: {room.capacity} guests</div>
                                                    </div>
                                                    <div className="text-sm font-semibold text-blue-400">
                                                        {room.price}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Wallet Address (compact) */}
                                {hotel.walletAddress && (
                                    <div className="mt-4 pt-3 border-t border-zinc-800">
                                        <div className="text-xs text-zinc-500">
                                            Wallet: <code className="text-zinc-400 font-mono">{hotel.walletAddress.slice(0, 20)}...</code>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
