"use client";

import Link from "next/link";
import { ExternalLink, Globe, CheckCircle } from "lucide-react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Nonprofit } from "@/types/database";

interface NonprofitModalProps {
  nonprofit: Nonprofit | null;
  open: boolean;
  onClose: () => void;
}

export function NonprofitModal({ nonprofit, open, onClose }: NonprofitModalProps) {
  if (!nonprofit) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <ModalHeader>
        <div className="flex items-start gap-4 pr-8">
          {nonprofit.logo_url ? (
            <img
              src={nonprofit.logo_url}
              alt={`${nonprofit.name} logo`}
              className="h-16 w-16 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-2xl">
              {nonprofit.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">
                {nonprofit.name}
              </h2>
              {nonprofit.featured && (
                <Badge variant="success">Featured</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {nonprofit.category && (
                <Badge variant="secondary">
                  {nonprofit.category.icon && (
                    <span className="mr-1">{nonprofit.category.icon}</span>
                  )}
                  {nonprofit.category.name}
                </Badge>
              )}
              {nonprofit.ein && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  EIN: {nonprofit.ein}
                </span>
              )}
            </div>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Mission */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Mission</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {nonprofit.mission || nonprofit.description || "No mission statement available."}
          </p>
        </div>

        {/* Description (if different from mission) */}
        {nonprofit.description && nonprofit.description !== nonprofit.mission && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">About</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {nonprofit.description}
            </p>
          </div>
        )}

        {/* Website */}
        {nonprofit.website && (
          <a
            href={nonprofit.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Globe className="h-4 w-4" />
            Visit Website
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button asChild>
          <Link href={`/donate?nonprofit=${nonprofit.id}`} onClick={onClose}>
            Donate Now
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href={`/directory/${nonprofit.id}`} onClick={onClose}>
            View Full Profile
          </Link>
        </Button>
      </ModalFooter>
    </Modal>
  );
}
